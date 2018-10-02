// Requires cors.js and pagination.js to be loaded first

"use strict";

var PASTA_CONFIG = {
   "server": "https://pasta.lternet.edu/package/search/eml?", // PASTA server
   "filter": "&fq=scope:knb-lter-nwt", // Filter results for an LTER site
   "limit": 20, // Max number of results to retrieve per page
   "resultsElementId": "searchResults", // Element to contain results
   "urlElementId": "searchUrl", // Element to display search URL
   "countElementId": "resultCount", // Element showing number of results
   "csvElementId": "csvDownload", // Element with link to download results as CSV
   "pagesTopElementId": "paginationTop", // Element to display result page links above results
   "pagesBotElementId": "paginationBot", // Element to display result page links below results
   "showPages": 5, // MUST BE ODD NUMBER! Max number of page links to show
   "sortDiv": "sortDiv" // Element with interactive sort options
};

var QUERY_URL = ""; // Query URL without row limit or start parameter

// Get URL arguments
function getParameterByName(name, url) {
   if (!url) url = window.location.href;
   name = name.replace(/[\[\]]/g, "\\$&");
   var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
   if (!results) return null;
   if (!results[2]) return "";
   return decodeURIComponent(results[2].replace(/\+/g, " ")).trim();
}

// Parse Pasta search results into HTML
function parsePastaResults(xmlDoc) {
   var docs = xmlDoc.getElementsByTagName("document");
   var html = [];
   var sortDiv = document.getElementById(PASTA_CONFIG["sortDiv"]);
   if (sortDiv) {
      if (docs.length)
         sortDiv.style.display = "block";
      else
         sortDiv.style.display = "none";
   }
   for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      var authors = doc.getElementsByTagName("responsibleParties")[0].childNodes[0].nodeValue.trim();
      var names = authors.replace(/\r?\n/g, "; ");
      var date;
      try {
         date = " (Published " + doc.getElementsByTagName("pubdate")[0].childNodes[0].nodeValue + ")";
      } catch (error) {
         date = "";
      }
      var link = "";
      try {
         var doi = doc.getElementsByTagName("doi")[0].childNodes[0].nodeValue;
         if (doi.slice(0, 4) === "doi:") {
            doi = doi.slice(4);
         }
         link = "http://dx.doi.org/" + doi;
      } catch (err) {
         link = ("https://portal.edirepository.org/nis/mapbrowse?packageid=" +
            doc.getElementsByTagName("packageid")[0].childNodes[0].nodeValue);
      }
      var title = '<a rel="external" href="' + link + '" target="_blank">' +
         doc.getElementsByTagName("title")[0].childNodes[0].nodeValue.trim() + '</a>';
      var row = '<p><span class="dataset-title">' + title +
         '</span><br><span class="dataset-author">' + names + date +
         '</span></p>';
      html.push(row);
   }
   if (docs.length) {
      return html.join("\n");
   } else {
      return "<p>Your search returned no results.</p>";
   }
}

function show_loading(isLoading) {
   var x = document.getElementById("loading-div");
   if (isLoading) {
      document.body.style.cursor = "wait";
      x.style.display = "block";
   } else {
      document.body.style.cursor = "default";
      x.style.display = "none";
   }
}

function setHtml(elId, innerHtml) {
   var el = document.getElementById(elId);
   if (el)
      el.innerHTML = innerHtml;
   else
      console.log("Could not find element with ID " + elId);
}

function downloadCsv(count) {
   if (count) show_loading(true);
   var limit = 2000;
   var calls = count / limit;
   if (parseInt(calls) != calls) calls = parseInt(calls) + 1;
   var callsRemaining = calls;
   var allRows = [
      ["Title", "Creators", "Year_Published", "DOI", "Package_ID"]
   ];
   var start = 0;
   var baseUri = QUERY_URL + "&rows=" + limit + "&start="

   function addChunk(headers, response) {
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(response, "text/xml");
      var docs = xmlDoc.getElementsByTagName("document");
      for (var i = 0; i < docs.length; i++) {
         var doc = docs[i];
         var authors = doc.getElementsByTagName("responsibleParties")[0].childNodes[0].nodeValue.trim();
         var names = authors.replace(/\r?\n/g, "; ");
         var date;
         try {
            date = doc.getElementsByTagName("pubdate")[0].childNodes[0].nodeValue;
         } catch (error) {
            date = "";
         }
         var doi = "";
         var els = doc.getElementsByTagName("doi");
         if (els.length && els[0].childNodes.length) {
            doi = els[0].childNodes[0].nodeValue;
         }
         var packageId = doc.getElementsByTagName("packageid")[0].childNodes[0].nodeValue;
         var title = doc.getElementsByTagName("title")[0].childNodes[0].nodeValue.trim();
         var row = [title, names, date, doi, packageId];
         allRows.push(row);
      }

      --callsRemaining;
      if (callsRemaining <= 0) {
         var csv = CSV.arrayToCsv(allRows);
         var exportedFilenmae = "dataset_catalog.csv";
         // Snippet from https://medium.com/@danny.pule/export-json-to-csv-file-using-javascript-a0b7bc5b00d2
         var blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;'
         });
         show_loading(false);
         if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, exportedFilenmae);
         } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
               // Browsers that support HTML5 download attribute
               var csvUrl = URL.createObjectURL(blob);
               link.setAttribute("href", csvUrl);
               link.setAttribute("download", exportedFilenmae);
               link.style.visibility = "hidden";
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
            }
         }
      }
   }

   for (var i = 0; i < calls; i++) {
      var url = baseUri + start;
      makeCorsRequest(url, addChunk, errorCallback);
      start += limit;
   }

   return false; // Prevents calling function from following href
}

function makeCsvLink(count) {
   if (!count) return "";
   var html = '<a href="" onclick="return downloadCsv(' + count + ');">' +
      'Download all results as CSV</a>';
   return html;
}

// Function to call if CORS request is successful
function successCallback(headers, response) {
   show_loading(false);

   // Write results to page
   var parser = new DOMParser();
   var xmlDoc = parser.parseFromString(response, "text/xml");
   setHtml(PASTA_CONFIG["resultsElementId"], parsePastaResults(xmlDoc));
   var count = parseInt(xmlDoc.getElementsByTagName("resultset")[0].getAttribute("numFound"));
   setHtml(PASTA_CONFIG["csvElementId"], makeCsvLink(count));

   // Add links to additional search result pages if necessary
   var currentStart = getParameterByName("start");
   if (!currentStart) {
      currentStart = 0;
   } else {
      currentStart = parseInt(currentStart);
   }
   var limit = parseInt(PASTA_CONFIG["limit"]);
   var showPages = parseInt(PASTA_CONFIG["showPages"]);
   var pageTopElementId = PASTA_CONFIG["pagesTopElementId"];
   var pageBotElementId = PASTA_CONFIG["pagesBotElementId"];
   showPageLinks(count, limit, showPages, currentStart, pageTopElementId);
   showPageLinks(count, limit, showPages, currentStart, pageBotElementId);
   showResultCount("", count, limit, currentStart, PASTA_CONFIG["countElementId"]);
}

// Function to call if CORS request fails
function errorCallback() {
   show_loading(false);
   alert("There was an error making the request.");
}

// Writes CORS request URL to the page so user can see it
function showUrl(url) {
   var txt = '<a href="' + url + '" target="_blank">' + url + '</a>';
   setHtml(PASTA_CONFIG["urlElementId"], txt);
}

function makeDateQuery(sYear, eYear, datayear, pubyear) {
   var query = "";
   if (datayear && !pubyear) {
      query = "&fq=(singledate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]+OR+(begindate:[*+TO+" + eYear + "-12-31T00:00:00Z/DAY]+AND+enddate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+NOW]))";
   } else if (pubyear && !datayear) {
      query = "&fq=pubdate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]";
   } else if (datayear && pubyear) {
      query = "&fq=(pubdate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]+AND+(singledate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]+OR+(begindate:[*+TO+" + eYear + "-12-31T00:00:00Z/DAY]+AND+enddate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+NOW])))";
   }
   return query;
}

function makeSortParam(sortBy) {
   var param = "&sort=" + sortBy + ",";
   if (sortBy === "score" || sortBy === "pubdate" || sortBy === "enddate")
      param += "desc";
   else
      param += "asc";
   param += "&sort=packageid,asc";
   return param;
}

// Enclose text in quotes if there are spaces and if the text does not already include quotes or special operators
function addQuotes(text) {
   if (!~text.indexOf(" ") || ~text.indexOf("+") || ~text.indexOf('"'))
      return text;
   else
      return '"' + text + '"';
}

function makeQueryUrlBase(userQuery, coreArea, creator, sYear, eYear, datayear, pubyear,
   pkgId, taxon, geo, sortBy) {
   var base = PASTA_CONFIG["server"];
   var fields = ["title",
      "pubdate",
      "doi",
      "packageid",
      "responsibleParties"
   ].toString();
   var params = "fl=" + fields + "&defType=edismax" + PASTA_CONFIG["filter"];
   if (coreArea && coreArea !== "any") {
      params += '&fq=keyword:"' + coreArea + '"';
   }
   var query = "&q=" + userQuery;
   if (creator) query += "+AND+(author:" + addQuotes(creator) + "+OR+organization:" + addQuotes(creator) + ")";
   if (pkgId) {
      pkgId = pkgId.replace(":", "%5C:");
      query += "+AND+(doi:" + pkgId + "+packageid:" + pkgId + "+id:" + pkgId + ")";
   }
   if (taxon) query += "+AND+taxonomic:" + addQuotes(taxon);
   if (geo) query += "+AND+geographicdescription:" + addQuotes(geo);
   var dateQuery = makeDateQuery(sYear, eYear, datayear, pubyear);
   var sort = makeSortParam(sortBy);
   var url = base + encodeURI(params + query + dateQuery + sort);
   return url;
}

// Passes search URL and callbacks to CORS function
function searchPasta(limit, pageStart) {
   var params = "&rows=" + limit + "&start=" + pageStart;
   var url = QUERY_URL + params;
   showUrl(url);
   show_loading(true);
   makeCorsRequest(url, successCallback, errorCallback);
}

function initCollapsible(expanded) {
   // Handles collapsible sections
   function showHide(el, show) {
      if (show) el.style.maxHeight = "900px";
      else el.style.maxHeight = null;
   }

   // Expand if user tabs into hidden element
   function listenForFocus(collapsibleEl, toggle) {
      function addFocusListener(collapsibleEl, tagName, toggle) {
         var els = collapsibleEl.getElementsByTagName(tagName);
         var i;
         for (i = 0; i < els.length; i++) {
            els[i].onfocus = function () {
               if (!toggle.checked) toggle.click();
            };
         };
      }
      addFocusListener(collapsibleEl, "SELECT", toggle);
      addFocusListener(collapsibleEl, "INPUT", toggle);
   }

   // Collapse when checked
   var els = document.getElementsByClassName("collapse-toggle");
   var i;
   for (i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.type && el.type === 'checkbox') {
         el.checked = expanded;
         var target = document.getElementById(el.getAttribute("aria-controls"));
         listenForFocus(target, el);
         showHide(target, expanded);
         el.setAttribute("aria-expanded", expanded.toString());
         el.onchange = function () {
            showHide(target, this.checked);
            this.setAttribute("aria-expanded", this.checked.toString());
         };
      }
   }
   // Toggle checkbox when user presses space or enter on label
   els = document.getElementsByClassName("lbl-toggle");
   for (i = 0; i < els.length; i++) {
      var label = els[i];
      label.onkeydown = function (e) {
         if (e.which === 32 || e.which === 13) {
            e.preventDefault();
            this.click();
         };
      };
   };
}

function initApp(expanded) {
   initCollapsible(expanded);

   var sortControl = document.getElementById("visibleSort");
   sortControl.onchange = function () {
      var hiddenSortControl = document.getElementById("sort");
      hiddenSortControl.value = this.options[this.selectedIndex].value;
      var form = document.getElementById("dataSearchForm");
      form.submit();
   };
}

function clearParams() {
   var areas = document.getElementById("coreArea");
   areas[0].selected = true;
   document.forms.dataSearchForm.creator.value = "";
   document.forms.dataSearchForm.identifier.value = "";
   document.forms.dataSearchForm.taxon.value = "";
   document.forms.dataSearchForm.geo.value = "";
   document.forms.dataSearchForm.data_year.checked = false;
   document.forms.dataSearchForm.publish_year.checked = false;
   document.forms.dataSearchForm.min_year.value = "1900";
   document.forms.dataSearchForm.max_year.value = "2018";
}

// Selects the desired value in the Select control. If value is not in the
// control, then first index is used. Returns actual selected value.
function setSelectValue(elId, desiredValue) {
   var el = document.getElementById(elId);
   if (!el || !el.length) return null;
   var result = el[0].value;
   for (var i = 0; i < el.length; i++) {
      if (desiredValue === el[i].value) {
         el[i].selected = true;
         result = desiredValue;
         break;
      }
   }
   return result;
}

function isInteger(x) {
   return (typeof x === 'number') && (x % 1 === 0);
}

function makeAutocomplete(elementId, choices, minChars) {
   if (!minChars) minChars = 2;
   var autocomplete = new autoComplete({
      selector: "#" + elementId,
      minChars: minChars,
      source: function (term, suggest) {
         term = term.toLowerCase();
         var suggestions = [];
         for (var i = 0; i < choices.length; i++)
            if (~choices[i].toLowerCase().indexOf(term))
               suggestions.push(choices[i]);
         suggest(suggestions);
      }
   });
   return autocomplete;
}

// When the window loads, read query parameters and perform search
window.onload = function () {
   var query = getParameterByName("q");
   var coreAreaParam = getParameterByName("coreArea");
   var creator = getParameterByName("creator");
   var sYear = parseInt(getParameterByName("s"));
   var eYear = parseInt(getParameterByName("e"));
   var datayear = getParameterByName("datayear") === "y";
   var pubyear = getParameterByName("pubyear") === "y";
   var pkgId = getParameterByName("id");
   var taxon = getParameterByName("taxon");
   var geo = getParameterByName("geo");
   var expanded = Boolean(getParameterByName("expanded"));
   var pageStart = getParameterByName("start");
   var sortParam = getParameterByName("sort");
   if (!pageStart) pageStart = 0;

   document.forms.dataSearchForm.q.value = query;
   document.forms.dataSearchForm.creator.value = creator;
   document.forms.dataSearchForm.identifier.value = pkgId;
   document.forms.dataSearchForm.taxon.value = taxon;
   document.forms.dataSearchForm.geo.value = geo;
   document.forms.dataSearchForm.data_year.checked = datayear;
   document.forms.dataSearchForm.publish_year.checked = pubyear;
   var coreArea = setSelectValue("coreArea", coreAreaParam);
   var sortBy = setSelectValue("visibleSort", sortParam);
   document.forms.dataSearchForm.sort.value = sortBy;

   if (isInteger(sYear))
      document.forms.dataSearchForm.min_year.value = sYear;
   else
      sYear = document.forms.dataSearchForm.min_year.value;
   if (!isInteger(eYear)) eYear = (new Date()).getFullYear()
   document.forms.dataSearchForm.max_year.value = eYear;

   initApp(expanded);

   if (!query) query = "*"; // default for empty query
   QUERY_URL = makeQueryUrlBase(query, coreArea, creator, sYear, eYear,
      datayear, pubyear, pkgId, taxon, geo, sortBy)
   searchPasta(PASTA_CONFIG["limit"], pageStart);

   makeAutocomplete("creator", PASTA_LOOKUP["responsibleParties"]);
   makeAutocomplete("taxon", PASTA_LOOKUP["taxonomic"]);
};