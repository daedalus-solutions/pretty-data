# prettify - Nodejs plugin

This is a nodejs plugin to **pretty-print** or **minify** text in **XML**, **JSON**, **CSS** and **SQL** formats.

**Version** - 1.0.0

##Description

- `prettify.xml(data)` - pretty print XML;

- `prettify.json(data)` - pretty print JSON;

- `prettify.css(data)` - pretty print CSS;

- `prettify.sql(data)` - pretty print SQL;

- `prettify.xmlmin(data [, preserveComments])` - minify XML;

- `prettify.jsonmin(data)` - minify JSON text;

- `prettify.cssmin(data [, preserveComments])` - minify CSS text;

- `prettify.sqlmin(data)` - minify SQL text;

**PARAMETERS:**

`@data` - String; XML, JSON, CSS or SQL text to beautify;

`@preserveComments` - Bool (optional, used in npp.minxml and npp.mincss only);
Set this flag to true to prevent removing comments from @data;

`@Return` - String;

**USAGE:**

`var prettify = require('prettify').prettify;`

`var xml_pp = prettify.xml(data);`

`var xml_min = prettify.xmlmin(data [,true]);`

`var json_pp = prettify.json(data);`

`var json_min = prettify.jsonmin(data);`

`var css_pp = prettify.css(data);`

`var css_min = prettify.cssmin(data [, true]);`

`var sql_pp = prettify.sql(data);`

`var sql_min = prettify.sqlmin(data);`
