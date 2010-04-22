This is a really simple search engine, built with:

* node.js
* Sphinx search server
* CouchDB
* Express web framework

Right now it uses Node.js v0.1.90 (`process.mixin` is the only thing that won't work in 0.1.91 though).

# Usage

First, you need to setup host to crawl in `settings.js`. Right now it's `finalfantasy.wikia.com`.
You also need CouchDB installed, and at least one database. Put database name and host into `settings.js`.
You need to install Sphinx server from http://www.sphinxsearch.com .

## Indexing

Run:

    node spider.js

Spider starts crawling pages and putting them into DB.

To index crawled pages with Sphinx, enter `node /path/to/xmlpipe2.js` in `sphinx.conf` as xmlpipe2 source. To index newly created source right now, start indexer manually:

    indexer <sourcename>

## Searching

To start site, launch

    node app.js

Site will be available at port 8000. Enter search terms in form and submit it.



