// Required packages: node-fetch, xml2js

"use strict";

var fs = require("fs");

var fetch = require("node-fetch");
var parseString = require("xml2js").parseString;

const PASTA_CONFIG = {
   "server": "https://pasta.lternet.edu/package/search/eml?", // PASTA server
   "filter": "&fq=scope:knb-lter-nwt", // Filter results for an LTER site
   "limit": 2000, // Max number of results to retrieve per page
   "fields": [
      "taxonomic",
      "author"
   ]
};

const OUT_FILE = "pasta_lookup.js";


function parseTaxa(doc) {
   var invalid = ["Division or Phylum", "kingdom", "phylum", "class", "order", "family", "genus", "species"].map(v => v.toLowerCase());

   function isValid(taxa) {
      return taxa && invalid.indexOf(taxa.toLowerCase()) === -1;
   }
   return doc["taxonomic"][0].split("\n").map(n => n.trim()).filter(isValid);
}


function parsePeople(doc) {
   var authorNodes = doc["authors"][0]["author"];
   var authors = [];
   if (authorNodes) {
      for (var authorIndex = 0; authorIndex < authorNodes.length; authorIndex++) {
         authors.push(authorNodes[authorIndex]);
      }
   }
   return authors;
}


function fetchChunk(uri) {
   console.log(uri);
   return new Promise(function (resolve, reject) {
      fetch(uri).then(function (response) {
         response.text().then(function (text) {
            parseString(text, function (err, result) {
               let chunk = {};
               for (let i = 0; i < PASTA_CONFIG["fields"].length; i++) {
                  chunk[PASTA_CONFIG["fields"][i]] = [];
               }

               for (let j = 0; j < result["resultset"]["document"].length; j++) {
                  let doc = result["resultset"]["document"][j];
                  if (PASTA_CONFIG["fields"].indexOf("taxonomic") > -1)
                     chunk["taxonomic"] = chunk["taxonomic"].concat(parseTaxa(doc));
                  if (PASTA_CONFIG["fields"].indexOf("author") > -1)
                     chunk["author"] = chunk["author"].concat(parsePeople(doc));
               }
               resolve(chunk);
            });
         });
      });
   });
}


function handleResults(chunks) {
   var result = {};
   for (let i = 0; i < PASTA_CONFIG["fields"].length; i++) {
      result[PASTA_CONFIG["fields"][i]] = [];
   }

   for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      for (let j = 0; j < PASTA_CONFIG["fields"].length; j++) {
         let field = PASTA_CONFIG["fields"][j];
         result[field] = result[field].concat(chunk[field]);
      }
   }

   for (let j = 0; j < PASTA_CONFIG["fields"].length; j++) {
      let field = PASTA_CONFIG["fields"][j];
      result[field] = getUnique(result[field]);
   }

   let js = "var PASTA_LOOKUP = " + JSON.stringify(result) + ";"
   fs.writeFile(OUT_FILE, js, function (err) {
      if (err) {
         return console.log(err);
      }
      console.log("Index saved as " + OUT_FILE);
   });
}


function getUnique(array) {
   return [...new Set(array)].sort();
}


function makeBaseUri() {
   const base = PASTA_CONFIG["server"];
   const fields = PASTA_CONFIG["fields"].toString();
   const params = "fl=" + fields + "&defType=edismax&q=*" + encodeURI(PASTA_CONFIG["filter"]);
   const limit = "&rows=" + PASTA_CONFIG["limit"];
   return base + params + limit;
}


function main() {
   const baseUri = makeBaseUri();
   let start = 0;
   let uri = baseUri + "&start=" + start;
   fetch(uri).then(function (response) {
      response.text().then(function (text) {
         parseString(text, function (err, result) {
            const count = result["resultset"]["$"]["numFound"];
            let promises = [];
            while (start < count) {
               let promise = fetchChunk(uri);
               promises.push(promise);
               start += PASTA_CONFIG["limit"];
               uri = baseUri + "&start=" + start;
            }
            Promise.all(promises).then(handleResults)
               .catch(console.error);
         });
      });
   });
}

main();