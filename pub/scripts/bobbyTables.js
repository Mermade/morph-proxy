String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function remove(arr,start,len) {
	arr.splice(start,len);
	return arr;
}

function sepColumns(sql) {
	var result = '';
	var quote = '';
	for (var c=0;c<sql.length;c++) {
		var ch = sql.charAt(c);
		if (!quote) {
			if ((ch == '"') || (ch == '`') || (ch == "'")) {
				quote = ch;
			}
		}
		else {
			if (ch == quote) {
				quote = '';
			}
		}

		if ((!quote) && (ch == ',')) {
			ch = '¬';
		}
		result += ch;
	}
	return result;
}

function mapType(sqlite,colName) {
	if (typeof sqlite == 'undefined') {
		sqlite = 'text';
	}
	sqlite = sqlite.toLocaleLowerCase().trim();
	sqlite = sqlite.replace(' primary key','');
	sqlite = sqlite.replace(' not null','');
	sqlite = sqlite.replace(' unique','');
	sqlite = sqlite.replace(' autoincrement','');
	sqlite = sqlite.replace(' key','');
	sqlite = sqlite.replace(/\(.*\)/g,'');
	sqlite = sqlite.replace(/[0-9]+/,'');
	sqlite = sqlite.trim();
	if ((sqlite == 'text') || (sqlite == 'string') || (sqlite == 'varchar') || (sqlite == '') || (sqlite == 'char') ||
		(sqlite == 'character') || (sqlite == 'nvarchar') || (sqlite == 'varying character') ||
		(sqlite == 'nchar') || (sqlite == 'native char') || (sqlite == 'clob')) return 'STRING';
	if ((sqlite == 'integer') || (sqlite == 'int') || (sqlite == 'tinyint') || (sqlite == 'smallint') || (sqlite == 'numeric') ||
		(sqlite == 'real') || (sqlite == 'number') || (sqlite == 'float') || (sqlite == 'mediumint') || (sqlite == 'int2') ||
		(sqlite == 'int8') || (sqlite == 'bigint') || (sqlite == 'unsigned big int') || (sqlite == 'double') ||
		(sqlite == 'double precision') || (sqlite == 'decimal')) return 'NUMBER';
	if ((sqlite == 'date') || (sqlite == 'datetime') || (sqlite == 'timestamp')) return 'DATE';
	if (sqlite == 'boolean') return 'BOOLEAN';
	if ((sqlite == 'blob') || (sqlite == 'json text')) return 'omit';
	if ((sqlite.startsWith('key')) && (colName == 'primary')) return 'omit';
	if (colName == 'unique') return 'omit';
	console.log('Unhandled: '+JSON.stringify(sqlite));
	return 'omit';
}

function getColumnsFromCreateStatement(sql) {
	var result = [];
	sql = sql.replace('CREATE TABLE ','').trim();

	if (sql.startsWith('"')) sql = remove(sql.split('"'),0,2).join('"');
	if (sql.startsWith('`')) sql = remove(sql.split('`'),0,2).join('`');
	if (sql.startsWith("'")) sql = remove(sql.split("'"),0,2).join("'");
	sql = sql.replace(/,\ *UNIQUE\ *\(.*\)/,'');
	sql = sql.replace(/PRIMARY KEY\ *\(.*\)/,'');
	//console.log(sql);

	sql = remove(sql.split('('),0,1).join('(');
	if (sql.endsWith(')')) sql = sql.substr(0,sql.length-1);

	sql = sepColumns(sql);
	var expected = sql.split('¬').length;

	//console.log(sql);

	var cols = sql.split('¬');
	var count = 0;
	for (var c=0;c<cols.length;c++) {
		var column = {};
		var colDef = cols[c].trim();

		colDef = colDef.replace(/ ON CONFLICT\ +.*[\ ¬],/g,'');
		colDef = colDef.replace(/ ON DELETE CASCADE/g,'');
		colDef = colDef.replace(/ ON UPDATE CASCADE/g,'');
		colDef = colDef.replace(/FOREIGN KEY\ *\(.*\)/g,'');
		colDef = colDef.replace(/\ *REFERENCES.*\(.*\)/g,'');

		var sep = ' ';
		var index = 0;
		if (colDef.startsWith('"')) {
			sep = '"';
			index = 1;
		}
		else if (colDef.startsWith("'")) {
			sep = "'";
			index = 1;
		}
		else if (colDef.startsWith('`')) {
			sep = '`';
			index = 1;
		}
		colDef = colDef.split(sep);
		if (colDef[index] != '') {
			column.name = colDef[index];
			column.label = colDef[index];
			column.type = mapType(colDef[index+1],column.name);
			if (column.type != 'omit') {
				result.push(column);
			}
		}
		count++;
	}
	if (count != expected) console.log('Column mismatch');
	return result;
}

var columnTypes = [
	{
		"name" : "STRING",
		"editor" : "TEXT",
		"operators" : [
			{
				"name" : "=",
				"label" : "is",
				"cardinality" : "ONE"
			},
			{
				"name" : "<",
				"label" : "is less than",
				"cardinality" : "ONE"
			},
			{
				"name" : "<=",
				"label" : "is less than or equal",
				"cardinality" : "ONE"
			},
			{
				"name" : ">",
				"label" : "is greater than",
				"cardinality" : "ONE"
			},
			{
				"name" : ">=",
				"label" : "is greater than or equal",
				"cardinality" : "ONE"
			},
			{
				"name" : "LIKE",
				"label" : "is like",
				"cardinality" : "ONE"
			}
		]
	},
	{
		"name" : "DATE",
		"editor" : "DATE",
		"operators" : [
			{
				"name" : "=",
				"label" : "is",
				"cardinality" : "ONE"
			},
			{
				"name" : "<",
				"label" : "is less than",
				"cardinality" : "ONE"
			},
			{
				"name" : "<=",
				"label" : "is less than or equal",
				"cardinality" : "ONE"
			},
			{
				"name" : ">",
				"label" : "is greater than",
				"cardinality" : "ONE"
			},
			{
				"name" : ">=",
				"label" : "is greater than or equal",
				"cardinality" : "ONE"
			}
		]
	},
	{
		"name" : "NUMBER",
		"editor" : "TEXT",
		"operators" : [
			{
				"name" : "=",
				"label" : "is",
				"cardinality" : "ONE"
			},
			{
				"name" : "<",
				"label" : "is less than",
				"cardinality" : "ONE"
			},
			{
				"name" : "<=",
				"label" : "is less than or equal",
				"cardinality" : "ONE"
			},
			{
				"name" : ">",
				"label" : "is greater than",
				"cardinality" : "ONE"
			},
			{
				"name" : ">=",
				"label" : "is greater than or equal",
				"cardinality" : "ONE"
			}
		]
	},
	{
		"editor": "SELECT",
		"name": "BOOLEAN",
		"operators": [
			{
				"name": "=",
				"label": "is",
				"cardinality": "ONE"
			}
		]
	}
];

function enumerate(request, callback) {
  if (request.columnTypeName == 'BOOLEAN') {
    callback([{value:'0', label:'False'}, {value:'1', label:'True'}]);
  }
}
