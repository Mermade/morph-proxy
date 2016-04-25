#Morph-proxy

Morph-proxy is a simple proxy for the Morph.io scraper API.

It allows you to query your data without revealing your API key.

Both free-form SQL and canned queries are supported.

It can be deployed to Heroku with one click:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

If you specify a `QUERY` environment variable in the Heroku setup, only this query will be available, regardless of what is sent in the query URL parameter.

Once running, you can replace `api.morph.io` with your Heroku app's URL and issue queries without the need to specify your API key. Only the scraper identified by the `OWNER` and `SCRAPER` environment variables can be accessed regardless of the path passed to the proxy.
If you specify a FORMAT environment variable, only this format will be returned by the proxy, ignoring the extension given in the query URL.

# Canned queries

To define a canned query (which you can think of as a pseudo stored-procedure), create an environment variable in the Heroku dashboard called QUERYnn (where nn is any number) containing your SQL query, using !1 to !9 as replaceable parameters.

In your front-end application, set the `query` URL parameter to the name of the query you wish to run (e.g. QUERY3) and !1 etc as needed for the replaceable parameter values.

Limited sanitisation of the query parameters is performed, as all morph.io database access via the API is read-only.
