/**
 *  prettify - nodejs plugin to prettify or minify data.
 *
 *	prettify.xml(data ) - pretty print XML;
 *	prettify.json(data) - pretty print JSON;
 *	prettify.css(data ) - pretty print CSS;
 *	prettify.sql(data)  - pretty print SQL;
 *
 *	prettify.xmlmin(data [, preserveComments] ) - minify XML;
 *	prettify.jsonmin(data)                      - minify JSON;
 *	prettify.cssmin(data [, preserveComments] ) - minify CSS;
 *	prettify.sqlmin(data)                       - minify SQL;
 *
 * PARAMETERS:
 *
 *	@data  			- String; XML, JSON, CSS or SQL text to beautify;
 * 	@preserveComments	- Bool (optional, used in minxml and mincss only);
 *				  Set this flag to true to prevent removing comments from @text;
 *	@Return 		- String;
 *
 * USAGE:
 *
 *	var prettify  = require('prettify').prettify;
 *
 *	var xml_pp   = prettify.xml(xml_text);
 *	var xml_min  = prettify.xmlmin(xml_text [,true]);
 *	var json_pp  = prettify.json(json_text);
 *	var json_min = prettify.jsonmin(json_text);
 *	var css_pp   = prettify.css(css_text);
 *	var css_min  = prettify.cssmin(css_text [, true]);
 *	var sql_pp   = prettify.sql(sql_text);
 *	var sql_min  = prettify.sqlmin(sql_text);
 *
 * TEST:
 *	comp-name:prettify$ node ./test/test_xml
 *	comp-name:prettify$ node ./test/test_json
 *	comp-name:prettify$ node ./test/test_css
 *	comp-name:prettify$ node ./test/test_sql
 */

function pp() {
  this.shift = ["\n"]; // array of shifts
  this.step = "  "; // 2 spaces
  var ix = 0;

  // initialize array with shifts; nesting level == 100 //
  for (ix = 0; ix < 100; ix++) {
    this.shift.push(this.shift[ix] + this.step);
  }
}

// ----------------------- XML section ----------------------------------------------------

pp.prototype.xml = function(text) {
  var ar = text
      .replace(/>\s{0,}</g, "><")
      .replace(/</g, "~::~<")
      .replace(/xmlns\:/g, "~::~xmlns:")
      .replace(/xmlns\=/g, "~::~xmlns=")
      .split("~::~"),
    len = ar.length,
    inComment = false,
    deep = 0,
    str = "",
    ix = 0;

  for (ix = 0; ix < len; ix++) {
    // start comment or <![CDATA[...]]> or <!DOCTYPE //
    if (ar[ix].search(/<!/) > -1) {
      str += this.shift[deep] + ar[ix];
      inComment = true;
      // end comment  or <![CDATA[...]]> //
      if (
        ar[ix].search(/-->/) > -1 ||
        ar[ix].search(/\]>/) > -1 ||
        ar[ix].search(/!DOCTYPE/) > -1
      ) {
        inComment = false;
      }
    }
    // end comment  or <![CDATA[...]]> //
    else if (ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1) {
      str += ar[ix];
      inComment = false;
    }
    // <elm></elm> //
    else if (
      /^<\w/.exec(ar[ix - 1]) &&
      /^<\/\w/.exec(ar[ix]) &&
      /^<[\w:\-\.\,]+/.exec(ar[ix - 1]) ==
        /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace("/", "")
    ) {
      str += ar[ix];
      if (!inComment) deep--;
    }
    // <elm> //
    else if (
      ar[ix].search(/<\w/) > -1 &&
      ar[ix].search(/<\//) == -1 &&
      ar[ix].search(/\/>/) == -1
    ) {
      str = !inComment ? (str += this.shift[deep++] + ar[ix]) : (str += ar[ix]);
    }
    // <elm>...</elm> //
    else if (ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) > -1) {
      str = !inComment ? (str += this.shift[deep] + ar[ix]) : (str += ar[ix]);
    }
    // </elm> //
    else if (ar[ix].search(/<\//) > -1) {
      str = !inComment ? (str += this.shift[--deep] + ar[ix]) : (str += ar[ix]);
    }
    // <elm/> //
    else if (ar[ix].search(/\/>/) > -1) {
      str = !inComment ? (str += this.shift[deep] + ar[ix]) : (str += ar[ix]);
    }
    // <? xml ... ?> //
    else if (ar[ix].search(/<\?/) > -1) {
      str += this.shift[deep] + ar[ix];
    }
    // xmlns //
    else if (ar[ix].search(/xmlns\:/) > -1 || ar[ix].search(/xmlns\=/) > -1) {
      str += this.shift[deep] + ar[ix];
    } else {
      str += ar[ix];
    }
  }

  return str[0] == "\n" ? str.slice(1) : str;
};

// ----------------------- JSON section ----------------------------------------------------

pp.prototype.json = function(text) {
  if (typeof text === "string") {
    return JSON.stringify(JSON.parse(text), null, this.step);
  }
  if (typeof text === "object") {
    return JSON.stringify(text, null, this.step);
  }
  return null;
};

// ----------------------- CSS section ----------------------------------------------------

pp.prototype.css = function(text) {
  var ar = text
      .replace(/\s{1,}/g, " ")
      .replace(/\{/g, "{~::~")
      .replace(/\}/g, "~::~}~::~")
      .replace(/\;/g, ";~::~")
      .replace(/\/\*/g, "~::~/*")
      .replace(/\*\//g, "*/~::~")
      .replace(/~::~\s{0,}~::~/g, "~::~")
      .split("~::~"),
    len = ar.length,
    deep = 0,
    str = "",
    ix = 0;

  for (ix = 0; ix < len; ix++) {
    if (/\{/.exec(ar[ix])) {
      str += this.shift[deep++] + ar[ix];
    } else if (/\}/.exec(ar[ix])) {
      str += this.shift[--deep] + ar[ix];
    } else if (/\*\\/.exec(ar[ix])) {
      str += this.shift[deep] + ar[ix];
    } else {
      str += this.shift[deep] + ar[ix];
    }
  }
  return str.replace(/^\n{1,}/, "");
};

// ----------------------- SQL section ----------------------------------------------------

function isSubquery(str, parenthesisLevel) {
  return (
    parenthesisLevel -
    (str.replace(/\(/g, "").length - str.replace(/\)/g, "").length)
  );
}

function split_sql(str, tab) {
  return (
    str
      .replace(/\s{1,}/g, " ")

      .replace(/ AND /gi, "~::~" + tab + tab + "AND ")
      .replace(/ BETWEEN /gi, "~::~" + tab + "BETWEEN ")
      .replace(/ CASE /gi, "~::~" + tab + "CASE ")
      .replace(/ ELSE /gi, "~::~" + tab + "ELSE ")
      .replace(/ END /gi, "~::~" + tab + "END ")
      .replace(/ FROM /gi, "~::~FROM ")
      .replace(/ GROUP\s{1,}BY/gi, "~::~GROUP BY ")
      .replace(/ HAVING /gi, "~::~HAVING ")
      //.replace(/ IN /ig,"~::~"+tab+"IN ")
      .replace(/ IN /gi, " IN ")
      .replace(/ JOIN /gi, "~::~JOIN ")
      .replace(/ CROSS~::~{1,}JOIN /gi, "~::~CROSS JOIN ")
      .replace(/ INNER~::~{1,}JOIN /gi, "~::~INNER JOIN ")
      .replace(/ LEFT~::~{1,}JOIN /gi, "~::~LEFT JOIN ")
      .replace(/ RIGHT~::~{1,}JOIN /gi, "~::~RIGHT JOIN ")
      .replace(/ ON /gi, "~::~" + tab + "ON ")
      .replace(/ OR /gi, "~::~" + tab + tab + "OR ")
      .replace(/ ORDER\s{1,}BY/gi, "~::~ORDER BY ")
      .replace(/ OVER /gi, "~::~" + tab + "OVER ")
      .replace(/\(\s{0,}SELECT /gi, "~::~(SELECT ")
      .replace(/\)\s{0,}SELECT /gi, ")~::~SELECT ")
      .replace(/ THEN /gi, " THEN~::~" + tab + "")
      .replace(/ UNION /gi, "~::~UNION~::~")
      .replace(/ USING /gi, "~::~USING ")
      .replace(/ WHEN /gi, "~::~" + tab + "WHEN ")
      .replace(/ WHERE /gi, "~::~WHERE ")
      .replace(/ WITH /gi, "~::~WITH ")
      //.replace(/\,\s{0,}\(/ig,",~::~( ")
      //.replace(/\,/ig,",~::~"+tab+tab+"")
      .replace(/ ALL /gi, " ALL ")
      .replace(/ AS /gi, " AS ")
      .replace(/ ASC /gi, " ASC ")
      .replace(/ DESC /gi, " DESC ")
      .replace(/ DISTINCT /gi, " DISTINCT ")
      .replace(/ EXISTS /gi, " EXISTS ")
      .replace(/ NOT /gi, " NOT ")
      .replace(/ NULL /gi, " NULL ")
      .replace(/ LIKE /gi, " LIKE ")
      .replace(/\s{0,}SELECT /gi, "SELECT ")
      .replace(/~::~{1,}/g, "~::~")
      .split("~::~")
  );
}

pp.prototype.sql = function(text) {
  var ar_by_quote = text
      .replace(/\s{1,}/g, " ")
      .replace(/\'/gi, "~::~'")
      .split("~::~"),
    len = ar_by_quote.length,
    ar = [],
    deep = 0,
    tab = this.step,
    parenthesisLevel = 0,
    str = "",
    ix = 0;

  for (ix = 0; ix < len; ix++) {
    if (ix % 2) {
      ar = ar.concat(ar_by_quote[ix]);
    } else {
      ar = ar.concat(split_sql(ar_by_quote[ix], tab));
    }
  }

  len = ar.length;
  for (ix = 0; ix < len; ix++) {
    parenthesisLevel = isSubquery(ar[ix], parenthesisLevel);

    if (/\s{0,}\s{0,}SELECT\s{0,}/.exec(ar[ix])) {
      ar[ix] = ar[ix].replace(/\,/g, ",\n" + tab + tab + "");
    }

    if (/\s{0,}\(\s{0,}SELECT\s{0,}/.exec(ar[ix])) {
      deep++;
      str += this.shift[deep] + ar[ix];
    } else if (/\'/.exec(ar[ix])) {
      if (parenthesisLevel < 1 && deep) {
        deep--;
      }
      str += ar[ix];
    } else {
      str += this.shift[deep] + ar[ix];
      if (parenthesisLevel < 1 && deep) {
        deep--;
      }
    }
  }

  str = str.replace(/^\n{1,}/, "").replace(/\n{1,}/g, "\n");
  return str;
};

// ----------------------- min section ----------------------------------------------------

pp.prototype.xmlmin = function(text, preserveComments) {
  var str = preserveComments
    ? text
    : text.replace(
        /\<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/g,
        ""
      );
  return str.replace(/>\s{0,}</g, "><");
};

pp.prototype.jsonmin = function(text) {
  return text
    .replace(/\s{0,}\{\s{1,}/g, "{")
    .replace(/\s{0,}\[$/g, "[")
    .replace(/\[\s{0,}/g, "[")
    .replace(/:\s{0,}\[/g, ":[")
    .replace(/\s{1,}\}\s{0,}/g, "}")
    .replace(/\s{0,}\]\s{0,}/g, "]")
    .replace(/\"\s{0,}\,/g, '",')
    .replace(/\,\s{0,}\"/g, ',"')
    .replace(/\"\s{0,}:/g, '":')
    .replace(/:\s{0,}\"/g, ':"')
    .replace(/:\s{0,}\[/g, ":[")
    .replace(/\,\s{0,}\[/g, ",[")
    .replace(/\,\s{2,}/g, ", ")
    .replace(/\]\s{0,},\s{0,}\[/g, "],[");
};

pp.prototype.cssmin = function(text, preserveComments) {
  var str = preserveComments
    ? text
    : text.replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g, "");
  return str
    .replace(/\s{1,}/g, " ")
    .replace(/\{\s{1,}/g, "{")
    .replace(/\}\s{1,}/g, "}")
    .replace(/\;\s{1,}/g, ";")
    .replace(/\/\*\s{1,}/g, "/*")
    .replace(/\*\/\s{1,}/g, "*/");
};

pp.prototype.sqlmin = function(text) {
  return text
    .replace(/\s{1,}/g, " ")
    .replace(/\s{1,}\(/, "(")
    .replace(/\s{1,}\)/, ")");
};

// --------------------------------------------------------------------------------------------

exports.prettify = new pp();
