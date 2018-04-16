"use strict";

// Fake a successful CORS request.
function makeCorsRequest(url, successCallback, errorCallback) {
    var text = "<resultset numFound='22' start='0' rows='2'>" +
        "<document>" +
        "    <title>Biomarker assessment of spatial and temporal changes in the composition of" +
        " flocculent material (floc) in the subtropical wetland of the Florida Coastal" +
        " Everglades (FCE) from May 2007 to December 2009</title>" +
        "    <packageid>knb-lter-fce.1206.2</packageid>" +
        "    <pubdate>2015</pubdate>" +
        "    <doi>doi:10.6073/pasta/e84cc609ffbc63bb45bd484810e6746b</doi>" +
        "    <authors>" +
        "        <author>Jaffe, Rudolf</author>" +
        "        <author>Pisani, Oliva</author>" +
        "    </authors>" +
        "</document>" +
        "<document>" +
        "    <title>Bulk Parameters for Soils/Sediments from the Shark River Slough and Taylor" +
        "    Slough, Everglades National Park (FCE), from October 2000 to January 2001</title>" +
        "    <packageid>knb-lter-fce.1163.2</packageid>" +
        "    <pubdate>2004</pubdate>" +
        "    <doi>doi:10.6073/pasta/435f4c70788b8199849b43c5445d3367</doi>" +
        "    <authors>" +
        "        <author>Mead, Ralph</author>" +
        "    </authors>" +
        "</document>" +
        "</resultset>";
    successCallback(null, text);
}


