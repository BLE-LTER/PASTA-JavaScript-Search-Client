# PASTA-JavaScript-Search-Client

[![DOI](https://zenodo.org/badge/129800607.svg)](https://zenodo.org/badge/latestdoi/129800607)

Example HTML, CSS, and JavaScript for searching for items in a PASTA repository

For a live demo, download the code, paste your EDI API Access Key into PASTA_CONFIG (see notes below) and open public.html in your browser. The key is required by EDI for requests to work.

For an example of the catalog in use, see [BLE's Catalog](https://ble.lternet.edu/catalog).

## Motivation

[LTER sites](https://lternet.edu/) which archive data at [EDI](https://environmentaldatainitiative.org/) may wish to use the [PASTA API](https://pastaplus-core.readthedocs.io/en/latest/doc_tree/pasta_api/data_package_manager_api.html#search-data-packages) to create a searchable data catalog on their website. This project includes example code supporting such functionality.

## Prerequisite: API Access Key

EDI requires API access keys when making requests to the REST API. To get one:

1. https://auth.edirepository.org/auth/ui/signin
2. Sign in.
3. **Groups**.
4. **New Group**.
5. Name it `Authentication Group`, or whatever you want.
6. Description: `Provides API access key for catalog searches`.
7. Click **Add**.
8. In the top right corner, click the dropdown next to your profile picture and click **Access Keys**.
9. **New Key**.
10. Name: `Catalog Access Key`.
11. Principal: **Authentication Group** (or whatever you named it).
12. For now, our recommendation is to leave the default valid date range of one year. Set a calendar reminder to update the key a year from now. This guidance may change as we and EDI get more experience using these keys.
13. **Add**.
14. Copy the key and save it offline.
15. Open your local copy of **public/pasta.js** and paste your key in the `PASTA_CONFIG["EdiApiAccessKey"]` item.

## Usage for Your Site

Start with the demo in the `public` folder and adapt the code for your site.  See the `PASTA_CONFIG` variable in `pasta.js` for basic configuration options.  For example, you will change `PASTA_CONFIG["filter"]` to filter results for your site. The example assumes the site used the knb-lter-[three letter acronym] pattern in its dataset metadata. If your site follows a different pattern, than change the filter accordingly. See the [PASTA documentation](https://pastaplus-core.readthedocs.io/en/latest/doc_tree/pasta_api/data_package_manager_api.html#search-data-packages) for possible query options.

You may want to adjust the layout and styles in the demo page to match your website.

Not using static HTML?  That's OK.  See for example instructions for [Squarespace](squarespace.md).

### Dataset Link Format

The search results can link to datasets using their DOI or the direct `portal.edirepository.org` link. The DOI link is less likely to break, but the user has to go through a human verification step to see the dataset. If you use the direct EDI link, then you bypass the human verification step. Note that the direct link makes use of you EDI API Access Key.

### Source for Building the HTML

To build the HTML for search results, you can use PASTA results or EDI's cite service. The cite service is a little simpler, but the code handles both. See the `useCiteService` parameter in `PASTA_CONFIG`.

### Pagination

PASTA allows you to limit the number of results returned per page. If you do not wish to use pagination, set `PASTA_CONFIG["limit"]` to a number higher than the number of datasets available for your site.

If you want pagination but do not need page links both above and below search results, simply replace the element ID in `PASTA_CONFIG["pagesBotElementId"]` (or `pagesTopElementId`) with an empty string, `""`.

### Hiding Other Items

Similar to pagination, you can hide the search URL, the text summarizing the result count, and even the sorting options by replacing element IDs with empty strings in `PASTA_CONFIG`.

### Autocomplete

In the demo page, creator and taxonomy input fields support autocomplete.  Try typing a couple of characters into the creator box and see what happens.  

We use [Pixabay's autocomplete](https://github.com/Pixabay/JavaScript-autoComplete) plugin. Thanks Pixabay!

Autocomplete requires creating a list of possible choices, and activating autocomplete for a given input via code in `pasta.js`.  The list is imported as a script containing a `PASTA_LOOKUP` variable with arrays of choices for each desired autocomplete category. Once you create your choice arrays, don't forget to enable autocomplete for the appropriate inputs.  See how the `creator` input was handled in `pasta.js` for an example.

One way to generate the choice arrays is to harvest metadata for all datasets for your site from PASTA.  The `harvester` folder contains a `pasta_harvester.js` script demonstrating one way of doing that. Note that sometimes metadata is messy, such as taxonomy information which may include freeform text.  The harvester requires `Node.js` with the `node-fetch` and `xml2js` packages installed. Be sure to update `PASTA_CONFIG["EdiApiAccessKey"]` and `PASTA_CONFIG["filter"]` with your key and your site acronym or desired filter.

### Caveats

The success of search queries depends upon the metadata that the LTER site provided when submitting data to the archive.  For example, we assume the LTER Core Area was included as a **keyword** in the metadata.  If your site follows different conventions, you will need to modify `pasta.js` to filter accordingly.

## Acknowledgments

CSV export uses uselesscode's JS CSV serializer (MIT Licensed):
http://www.uselesscode.org/javascript/csv/
