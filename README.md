# PASTA-JavaScript-Search-Client
Example HTML, CSS, and JavaScript for searching for items in a PASTA repository

[Live demo at RawGit](https://cdn.rawgit.com/twhiteaker/PASTA-JavaScript-Search-Client/3a1f352b/public/demo.html)

## Motivation

[LTER sites](https://lternet.edu/) which archive data at [EDI](https://environmentaldatainitiative.org/) may wish to use the [PASTA API](https://pastaplus-core.readthedocs.io/en/latest/doc_tree/pasta_api/data_package_manager_api.html#search-data-packages) to create a searchable data catalog on their website. This project includes example code supporting such functionality.

## Usage for Your Site

Start with the demo in the `public` folder and adapt the code for your site.  See the `PASTA_CONFIG` variable in `pasta.js` for basic configuration options.  For example, you will change `PASTA_CONFIG["filter"]` to filter results for your site. The example assumes the site used the knb-lter-[three letter acronym] pattern in its dataset metadata. If your site follows a different pattern, than change the filter accordingly. See the [PASTA documentation](https://pastaplus-core.readthedocs.io/en/latest/doc_tree/pasta_api/data_package_manager_api.html#search-data-packages) for possible query options.

You may want to adjust the layout and styles in the demo page to match your website.

### Pagination

PASTA allows you to limit the number of results returned per page. If you do not wish to use pagination, set `PASTA_CONFIG["limit"]` to a number higher than the number of datasets available for your site.

If you want pagination but do not need page links both above and below search results, simply replace the element ID in `PASTA_CONFIG["pagesBotElementId"]` (or `pagesTopElementId`) with an empty string, `""`. 

### Hiding Other Items

Similar to pagination, you can hide the search URL, the text summarizing the result count, and even the sorting options by replacing element IDs with empty strings in `PASTA_CONFIG`.

### Autocomplete

In the demo page, creator and taxonomy input fields support autocomplete.  Try typing a couple of characters into the creator box and see what happens.  

We use [Pixabay's autocomplete](https://github.com/Pixabay/JavaScript-autoComplete) plugin. Thanks Pixabay!

Autocomplete requires creating a list of possible choices, and activating autocomplete for a given input via code in `pasta.js`.  The list is imported as a script containing a `PASTA_LOOKUP` variable with arrays of choices for each desired autocomplete category. Once you create your choice arrays, don't forget to enable autocomplete for the appropriate inputs.  See how the `creator` input was handled in `pasta.js` for an example.

One way to generate the choice arrays is to harvest metadata for all datasets for your site from PASTA.  The `harvester` folder contains a `pasta_harvester.js` script demonstrating one way of doing that. Note that sometimes metadata is messy, such as taxonomy information which may include freeform text.  The harvester requires `Node.js` with the `node-fetch` and `xml2js` packages installed.

### Caveats

The success of search queries depends upon the metadata that the LTER site provided when submitting data to the archive.  For example, we assume the LTER Core Area was included as a **keyword** in the metadata.  If your site follows different conventions, you will need to modify `pasta.js` to filter accordingly.  
