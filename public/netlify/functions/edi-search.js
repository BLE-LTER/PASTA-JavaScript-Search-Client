"use strict";

export default async function handler(request) {
   // Allow only GET requests.
   if (request.method !== "GET") {
      return new Response("Method not allowed.", {
         status: 405,
         headers: {
            "Allow": "GET",
            "Content-Type": "text/plain; charset=utf-8"
         }
      });
   }

   const apiKey = process.env.PASTA_API_KEY;

   if (!apiKey) {
      console.error("PASTA_API_KEY environment variable is missing.");

      return new Response(
         "The PASTA API Key is missing.",
         {
            status: 500,
            headers: {
               "Content-Type": "text/plain; charset=utf-8"
            }
         }
      );
   }

   try {
      const incomingUrl = new URL(request.url);

      /*
       * Copy the search parameters sent by pasta.js.
       * The API key is added only inside this server-side function.
       */
      const ediUrl = new URL(
         "https://pasta.lternet.edu/package/search/eml"
      );

      ediUrl.searchParams.set("key", apiKey);

      incomingUrl.searchParams.forEach(function (value, name) {
         // Do not allow the browser to supply or replace the API key.
         if (name.toLowerCase() !== "key") {
            ediUrl.searchParams.append(name, value);
         }
      });

      const ediResponse = await fetch(ediUrl.toString(), {
         method: "GET",
         headers: {
            "Accept": "application/xml, text/xml, */*"
         }
      });

      const responseBody = await ediResponse.text();

      if (!ediResponse.ok) {
         console.error(
            "PASTA API request failed with status:",
            ediResponse.status
         );
      }

      return new Response(responseBody, {
         status: ediResponse.status,
         headers: {
            "Content-Type":
               ediResponse.headers.get("content-type") ||
               "application/xml; charset=utf-8",

            /*
             * Prevent caching of authenticated responses while testing.
             * This can be adjusted later if needed.
             */
            "Cache-Control": "no-store"
         }
      });
   } catch (error) {
      console.error("Unable to contact the PASTA API:", error);

      return new Response(
         "There was an error contacting the PASTA service.",
         {
            status: 502,
            headers: {
               "Content-Type": "text/plain; charset=utf-8"
            }
         }
      );
   }
}