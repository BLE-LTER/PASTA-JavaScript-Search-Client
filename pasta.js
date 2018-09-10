// Requires cors.js and pagination.js to be loaded first

"use strict";

var PASTA_CONFIG = {
   "server": "https://pasta.lternet.edu/package/search/eml?",  // PASTA server
   "filter": "&fq=scope:knb-lter-nwt",  // Filter results for an LTER site
   "limit": 20,  // Max number of results to retrieve per page
   "resultsElementId": "searchResults",  // Element to contain results
   "urlElementId": "searchUrl",  // Element to display search URL
   "countElementId": "resultCount",  // Element showing number of results
   "pagesElementId": "pagination",  // Element to display result page links
   "showPages": 5  // MUST BE ODD NUMBER! Max number of page links to show
};


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
   for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      var authors = doc.getElementsByTagName("author");
      var names = [];
      for (var j = 0; j < authors.length; j++) {
         names.push(authors[j].childNodes[0].nodeValue);
      }
      var names = names.join("; ") + " ";
      var date;
      try {
         date = "(Published " + doc.getElementsByTagName("pubdate")[0].childNodes[0].nodeValue + ")";
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
      }
      catch (err) {
         link = ("https://portal.edirepository.org/nis/mapbrowse?packageid="
            + doc.getElementsByTagName("packageid")[0].childNodes[0].nodeValue);
      }
      var title = '<a rel="external" href="' + link + '" target="_blank">' +
         doc.getElementsByTagName("title")[0].childNodes[0].nodeValue.trim() + '</a>';
      var row = '<p><span class="dataset-title">' + title +
         '</span><br><span class="dataset-author">' + names + date +
         '</span></p>';
      html.push(row);
   }
   if (html.length) {
      return html.join("\n");
   }
   else {
      return "<p>Your search returned no results.</p>";
   }
}


function show_loading(isLoading) {
   var x = document.getElementById("loading-div");
   if (isLoading) {
      document.body.style.cursor = "wait";
      x.style.display = "block";
   }
   else {
      document.body.style.cursor = "default";
      x.style.display = "none";
   }
}


// Function to call if CORS request is successful
function successCallback(headers, response) {
   show_loading(false);

   // Write results to page
   var parser = new DOMParser();
   var xmlDoc = parser.parseFromString(response, "text/xml");
   var resultHtml = parsePastaResults(xmlDoc);
   var elementId = PASTA_CONFIG["resultsElementId"];
   document.getElementById(elementId).innerHTML = resultHtml;

   // Add links to additional search result pages if necessary
   var currentStart = getParameterByName("start");
   if (!currentStart) {
      currentStart = 0;
   }
   else {
      currentStart = parseInt(currentStart);
   }
   var count = parseInt(xmlDoc.getElementsByTagName("resultset")[0].getAttribute("numFound"));
   var limit = parseInt(PASTA_CONFIG["limit"]);
   var showPages = parseInt(PASTA_CONFIG["showPages"]);
   var pageElementId = PASTA_CONFIG["pagesElementId"];
   showPageLinks(count, limit, showPages, currentStart, pageElementId);
   showResultCount("", count, limit, currentStart, PASTA_CONFIG["countElementId"]);
}


// Function to call if CORS request fails
function errorCallback() {
   show_loading(false);
   alert("There was an error making the request.");
}


// Writes CORS request URL to the page so user can see it
function showUrl(url) {
   url = encodeURI(url);
   var txt = '<a href="' + url + '" target="_blank">' + url + '</a>';
   var element = document.getElementById(PASTA_CONFIG["urlElementId"]);
   element.innerHTML = txt;
}


function makeDateQuery(sYear, eYear, datayear, pubyear) {
   var query = "";
   if (datayear && !pubyear) {
      query = "&fq=(singledate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]+OR+(begindate:[*+TO+" + eYear + "-12-31T00:00:00Z/DAY]+AND+enddate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+NOW]))";
   }
   else if (pubyear && !datayear) {
      query = "&fq=pubdate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]";
   }
   else if (datayear && pubyear) {
      query = "&fq=(pubdate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]+AND+(singledate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+" + eYear + "-12-31T00:00:00Z/DAY]+OR+(begindate:[*+TO+" + eYear + "-12-31T00:00:00Z/DAY]+AND+enddate:[" + sYear + "-01-01T00:00:00Z/DAY+TO+NOW])))";
   }
   return query;
}


// Passes search URL and callbacks to CORS function
function searchPasta(userQuery, coreArea, creator, sYear, eYear, datayear, pubyear,
   pkgId, taxon, geo, pageStart) {
   var base = PASTA_CONFIG["server"];
   var fields = ["title",
      "pubdate",
      "doi",
      "packageid",
      "author"].toString();
   var params = "fl=" + fields + "&defType=edismax" + PASTA_CONFIG["filter"];
   if (coreArea && coreArea !== "any") {
      params += '&fq=keyword:"' + coreArea + '"';
   }
   var limit = "&rows=" + PASTA_CONFIG["limit"];
   var start = "&start=" + pageStart;
   var query = "&q=" + userQuery;
   if (creator) query += "+AND+author:" + creator;
   if (pkgId) {
      pkgId = pkgId.replace(":", "%5C:");
      query += "+AND+(doi:" + pkgId + "+packageid:" + pkgId + "+id:" + pkgId + ")";
   }
   if (taxon) query += "+AND+taxonomic:" + taxon;
   if (geo) query += "+AND+geographicdescription:" + geo;
   var dateQuery = makeDateQuery(sYear, eYear, datayear, pubyear);
   var url = base + params + query + dateQuery + limit + start;
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
   if (!pageStart) pageStart = 0;

   document.forms.dataSearchForm.q.value = query;
   document.forms.dataSearchForm.creator.value = creator;
   document.forms.dataSearchForm.identifier.value = pkgId;
   document.forms.dataSearchForm.taxon.value = taxon;
   document.forms.dataSearchForm.geo.value = geo;
   document.forms.dataSearchForm.data_year.checked = datayear;
   document.forms.dataSearchForm.publish_year.checked = pubyear;

   var areas = document.getElementById("coreArea");
   var coreArea = "any";
   for (var i = 0; i < areas.length; i++) {
      if (coreAreaParam === areas[i].value) {
         areas[i].selected = true;
         coreArea = coreAreaParam;
         break;
      }
   }

   if (Number.isInteger(sYear))
      document.forms.dataSearchForm.min_year.value = sYear;
   else
      sYear = document.forms.dataSearchForm.min_year.value;
   if (!Number.isInteger(eYear)) eYear = (new Date()).getFullYear()
   document.forms.dataSearchForm.max_year.value = eYear;

   initCollapsible(expanded);

   if (!query) query = "*";  // default for empty query
   searchPasta(query, coreArea, creator, sYear, eYear, datayear, pubyear,
      pkgId, taxon, geo, pageStart);
};
