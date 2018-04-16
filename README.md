
# PASTA-JavaScript-Search-Client
Example HTML, CSS, and JavaScript for searching for items in a PASTA repository

## WARNING - NOT YET IMPLEMENTED

EDI must enable CORS on their PASTA server before this code will work.  In the meantime, an XML file representing a response describing two matching datasets is returned as a kluge in `cors.js`.  Eventually, `cors - for when EDI enables cors.js` should replace `cors.js`.

## Motivation

[LTER sites](https://lternet.edu/) which archive data at [EDI](https://environmentaldatainitiative.org/) may wish to use the [PASTA API](http://pastaplus-core.readthedocs.io/en/latest/doc_tree/pasta_api/data_package_manager_api.html) to create a searchable data catalog on their [static websites](https://en.wikipedia.org/wiki/Static_web_page).  Data catalogs must support searching by term as well as browsing by LTER core area. This project includes example code supporting such functionality, along with pagination since thousands of results could be returned.

## Usage

Open the HTML file in your browser and enter a search term like water. When you click Search, the application searches for datasets at EDI for the [FCE LTER site](http://fcelter.fiu.edu/). Results are summarized on the page with external links to more details at the original data archive.

You can click Search with no terms specified to show the entire catalog, which is the default behavior when you load the page. 

To try filtering by core area, remove the search term and select the Organic Matter core area.

## Customization

To change parameters such as how many search results to show at a time, see the PASTA_CONFIG variable in pasta.js.  There you can also change the server being queried and a filter for the group or user whose datasets you want to search.
