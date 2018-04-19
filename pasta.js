// Requires cors.js and pagination.js to be loaded first

"use strict";

var PASTA_CONFIG = {
    "server": "https://pasta.lternet.edu/package/search/eml?",  // PASTA server
    "filter": "knb-lter-fce",  // Filter results for an organization or user
    "limit": 10,  // Max number of results to retrieve per page
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
    return decodeURIComponent(results[2].replace(/\+/g, " "));
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
        var date = "(Published " + doc.getElementsByTagName("pubdate")[0].childNodes[0].nodeValue + ")";
        var link = "";
        try {
            link = "http://dx.doi.org/" + doc.getElementsByTagName("doi")[0].childNodes[0].nodeValue;
        }
        catch(err) {
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
    //document.getElementById("searchResults").innerHTML = response;
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
    var query = getParameterByName("q");
    if (query) query = query.trim();
    var coreArea = getParameterByName("coreArea");
    if (coreArea && coreArea !== "any") {
        if (!(query && query.trim())) {
            query = coreArea + " core area"
        }
        else {
            query += " in " + coreArea + " core area";
        }
    }    
    showResultCount(query, count, limit, currentStart, PASTA_CONFIG["countElementId"]);
}


// Function to call if CORS request fails
function errorCallback() {
    show_loading(false);
    alert("There was an error making the request.");
}


// Writes CORS request URL to the page so user can see it
function showUrl(url) {
    var txt = '<a href="' + url + '" target="_blank">' + url + '</a>';
    var element = document.getElementById(PASTA_CONFIG["urlElementId"]);
    element.innerHTML = txt;
}


// Passes search URL and callbacks to CORS function
function searchPasta(query, coreArea="", start=0) {
    var base = PASTA_CONFIG["server"];
    var fields = ["title",
                  "pubdate",
                  "doi",
                  "packageid",
                  "author"].toString();
    var params = "fl=" + fields + "&defType=edismax&fq=scope:" + PASTA_CONFIG["filter"];
    if (coreArea && coreArea !== "any") {
        params += '&fq=keyword:"' + coreArea + '"';
    }
    var limit = "&rows=" + PASTA_CONFIG["limit"];
    start = "&start=" + start;
    query = "&q=" + query;
    var url = base + params + limit + start + query;
    showUrl(url);
    show_loading(true);
    makeCorsRequest(url, successCallback, errorCallback);
}


// When the window loads, read query parameters and perform search
window.onload = function() {
    var query = getParameterByName("q");
    if (query) query = query.trim();
    var start = getParameterByName("start");
    var coreArea = getParameterByName("coreArea");
    document.forms.dataSearchForm.q.value = query;
    if (!(query && query.trim())) {
        query = "*";  // default for empty query
    }

    var areas = document.getElementById("coreArea");
    for (var i=0; i < areas.length; i++) {
        if (coreArea === areas[i].value) {
            areas[i].selected = true;
            break;
        }
    }
    
    if (!start) {
        start = 0;
    }
    searchPasta(query, coreArea, start);
};
