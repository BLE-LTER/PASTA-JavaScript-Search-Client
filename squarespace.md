# Using this tool with Squarespace

Squarespace users will need to use the custom code injection feature, which is
only available in the business (paid) plan. [See their tutorial](https://support.squarespace.com/hc/en-us/articles/205815908-Using-Code-Injection).

The steps are outlined below.

## Task 1. Adapt the demo page to your liking

If desired, edit the **demo.html** file so that the application displays the
elements that you want to see.  For example, if you don't need the advanced
search features, you can delete those elements from the HTML.

## Task 2. Place HTML into a code block on the desired page

1. Click **Edit > Add Content**, and select **</> code** (in the **More** section).
2. Select **HTML** in the dropdown menu.
3. Paste contents of the **demo.html** file, including only the sections between the
   `<body></body>` tags but omitting the `<body></body>` tags themselves. Hint:
   The last line of code you paste should be `<div class="pagination"
   id="paginationBot"></div>`. Do not include the `<!DOCTYPE html>`, `<html></html>` lines or any of the contents of the `<head>` element here (see next step).

## Task 3. Add JavaScript to the page header

1. Navigate to the page settings (gear icon) of the page where the demo.html
   code block was added and select **Advanced**.
2. Paste in all of the *.js scripts (cors.js, etc.). Each script should be
   contained within `<script></script>` tags, e.g.,

```HTML
<!-- cors.js -->
<script>
   "use strict";
   functionCreateCorsRequest (method, url){
   ...more code here...
   xhr.send();
   }
</script>
```

3. If your Squarespace template has AJAX loading enabled (most modern ones do),
   then you'll have to change the `window.onload` portion of pasta.js to use
   `Squarespace.onInitialize` instead.  Since that function can fire when you
   navigate away from the data search page, it can throw errors that would be
   visible in your browser console since your other pages don't have the same
   elements as your data search page. To get around that, you can have the
   pasta.js code only execute when a specific element id is found on the page,
   such as the search form which has an id of `dataSearchForm`.  The code edits
   look like the example below.

```js
// We're toward the end of the pasta.js code here
// We commented out the window.onload function to replace it
// window.onload = function () {
window.Squarespace.onInitialize(Y, function() {
   // This snippet prevents this code from running on other pages
   var searchEl = document.getElementById("dataSearchForm");
   if (!searchEl)
      return;

   // Rest of code that was in the onload function goes here
   function initApp(expanded) {
   // ...snip...

// The last line of the file was a close braket for the onload function.
// For Squarespace.onInitialize, we need a bracket AND a paren.
// };  // commented out the ending for onload
});  // New ending which fits Squarespace.onInitialize
```

## Task 4. Add CSS

The style rules for the application need to be added under custom CSS for the
whole website.

1. Click **Design > Custom CSS**.
2. Add the contents of search.css and auto-complete.css to custom CSS.

## Acknowledgments

Thank you, Sarah Elmendorf, for these instructions!  See her result at [NWT's
data page](https://nwt.lternet.edu/data-catalog).