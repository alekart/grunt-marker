var cheerio = require('cheerio');

function Marker(options) {
	this.options = options;
	this.components = this.options.components;
	this.templates = this.options.templates;

	// ignored attributes that should not be added to the replacement tag
	this.ignoreAttributes = ['responsive', 'small', 'large', 'bullet', 'bullet-alt'];
	this.allowedAttributes = ['id', 'class', 'style', 'href'];
}

/**
 * Main method to process on html file content
 * @param file (html from loaded file)
 * @returns {string} ready to write into a file html code
 */
Marker.prototype.markThemUp = function (file) {
	var self = this,
		tags = this.components.join(', '),
		$ = cheerio.load(file);

	this.html = $;

	// Because the structure of the DOM constantly shifts,
	// we carefully go through each custom tag one at a time,
	// until there are no more custom tags to parse
	while ($(tags).length > 0) {
		var elem = $(tags).eq(0);
		var newHtml = this.markToTag(elem);
		elem.replaceWith(newHtml);
	}

	// make tables responsive if needed
	var tables = $('table.responsive-table');
	tables.each(function (index, item) {
		var $item = cheerio(item);
		$item.replaceWith(self.addMsoConditions($item));
	});

	return $.html();
};

/**
 * Transform process for each element tag name
 * @param element (cheerio object)
 * @returns {string} transformed tag html
 */
Marker.prototype.markToTag = function (element) {
	var self = this,
		tag = element[0].name,
		html;

	switch (tag) {
		case 'row':
			element.addClass('row');
			return self.tagMarker(element);

		case 'column':
			element.addClass('column');
			return self.markColumn(element);

		case 'button':
			element.addClass('btn');
			return self.markButton(element);

		case 'ul':
		case 'ol':
		case 'li':
			return self.markList(element);

		default:
			// should never get here
			return cheerio.html(element);
	}
};

/**
 * Transform a custom tag to the real tag provided in templates
 * @param element (cheerio object)
 * @returns {string} // converted tag html
 */
Marker.prototype.tagMarker = function (element) {
	var markerName = element[0].name,
		attributes = this.getAttributes(element),
	// create a new element from the template
		$ = cheerio(this.templates[markerName]),
		content = element.html();

	this.markResponsive(element);

	// add all attributes from element to the replacement tag except the ignored ones
	for (var attr in attributes) {
		if (attributes.hasOwnProperty(attr) && this.ignoreAttributes.indexOf(attr) == -1) {
			$.attr(attr, attributes[attr]);
		}
	}

	// place the inner html from element into the new tag
	return cheerio.html($).replace('%content%', content);
};

/**
 * Specific for column tags that can have small/large attribute
 * transforms small/large attributes into classes and adds first/last class
 * @param element
 * @returns {string}
 */
Marker.prototype.markColumn = function (element) {
	var attributes = this.getAttributes(element);

	// if the row contains more than 1 column add first and last classes on first and last columns
	if (element.closest('.row').find('column, .column').length > 1) {
		if (!element.prev('.column').length)
			element.addClass('first');
		if (!element.next('column').length)
			element.addClass('last');
	}

	// place column size class
	for (var attr in attributes) {
		if (attributes.hasOwnProperty(attr) && (attr == "small" || attr == "large")) {
			var col;
			switch (attr) {
				case 'small':
					col = 'sm';
					break;
				case 'large':
					col = 'lg';
					break;
			}
			element.addClass('col-' + col + '-' + attributes[attr]);
		}
	}

	return this.tagMarker(element);
};

Marker.prototype.markButton = function (element) {
	var attributes = this.getAttributes(element),
		content = element.html();

	// add all attributes from element to the replacement tag except the ignored ones
	//for (var attr in attributes) {
	//	if (attributes.hasOwnProperty(attr) && this.ignoreAttributes.indexOf(attr) == -1) {
	//		$.attr(attr, attributes[attr]);
	//	}
	//}

	var btnHtml = '<!--[if mso]>' +
		'<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" '+ this.getAttrsAsText(element, true) +'>' +
		'<w:anchorlock/>' +
		'<center>' +
		'<![endif]-->' +
		'<a '+ this.getAttrsAsText(element) +'>' + content + '</a>' +
		'<!--[if mso]>' +
		'</center>' +
		'</v:roundrect>' +
		'<![endif]-->';

	return btnHtml;
};

Marker.prototype.markList = function (element) {
	var markerName = element[0].name,
		attributes = this.getAttributes(element),
		$ = cheerio(this.templates[markerName]),
		content = element.html();

	for (var attr in attributes) {
		if (attributes.hasOwnProperty(attr)) {
			$.attr(attr, attributes[attr]);
		}
	}

	switch (markerName) {
		case 'ul':
			$.addClass('ul list');
			break;
		case 'ol':
			$.addClass('ol list');
			break;
		case 'li':
			$.addClass('li-item');

			var bullet = $.find('td:first-child'),
				li = $.find('td:last-child');

			bullet.addClass('li li-bullet');
			li.addClass('li li-content');
			if (element.closest('.ol').length) {
				var olli = element.index() + 1 + '.';
				bullet.html(olli);
			}
			else {
				attributes = this.getAttributes(element.closest('.ul'));
				attr = attributes && attributes.hasOwnProperty('bullet') ? attributes.bullet : '•';
				if (/(\.png)|(\.gif)|(\.jpg)|(\.jpeg)$/g.test(attr)) {
					var bulletAlt = attributes && attributes.hasOwnProperty('bullet-alt') ? attributes['bullet-alt'] : ' ';
					attr = '<img src="' + attr + '" alt="' + bulletAlt + '">';
				}
				bullet.html(attr);
			}
			break;
	}

	return cheerio.html($).replace('%content%', content);
};

/**
 * Adds conditional comments on table parts
 * @param table (DOM)
 * @returns {string}
 */
Marker.prototype.addMsoConditions = function (table) {
	table.addClass('mso');
	var $ = cheerio;

	// to avoid DOM selections problems we review the element from the inside

	// first we replace all td.columns directly depending on the .responsive-table (this table)
	var columns = table.find('> tbody > tr > td.column');

	columns.each(function (index, item) {
		var $item = $(item),
			content = $item.html(); // get the column HTML content, whatever it is we don't need to proceed it

		// remove the content to not alter the tables inside the column
		$item.html('%content%');

		console.error($.html($item));


		var transformed = $.html($item)
			.replace(/(<td([^>]*)>)/g,
				'<!--[if mso]><td$2><![endif]-->\n<!--[if !mso]><!----><div$2><!-- <![endif]-->')
			.replace(/<\/td>/g,
				'<!--[if !mso]><!----></div><!-- <![endif]-->\n<!--[if mso]></td><![endif]-->')
			.replace('%content%', content); // replace the column content back

		$item.replaceWith(transformed); // replace th item with the transformed html
	});

	// then we do the same with tr's
	var rows = table.find('> tbody > tr');

	rows.each(function (index, item) {
		var $item = $(item),
			content = $item.html();

		// remove the content to not alter the tables inside the column
		$item.html('%content%');

		var transformed = $.html($item)
			.replace(/(<tr[^>]*>)/g,
				'<!--[if mso]>$1<![endif]-->')
			.replace(/<\/tr>/g,
				'<!--[if mso]></tr><![endif]-->')
			.replace('%content%', content);

		$item.replaceWith(transformed);
	});

	// and the last step, the table itself should be altered with comments
	var content = table.find('> tbody').html();

	// remove the content to not alter the tables inside the column
	table.find('> tbody').html('%content%');

	var transformedTable = $.html(table)
		.replace(/(<table(.*(responsive-table).*)><tbody>)/g,
			'<!--[if !mso]><!----><div $2>\n<!-- <![endif]--><!--[if mso]>$1<![endif]-->')
		.replace(/(<\/tbody><\/table>)/g,
			'<!--[if mso]>$1<![endif]--><!--[if !mso]><!----></div><!-- <![endif]-->')
		.replace('%content%', content);

	table.replaceWith(transformedTable);

	// TODO: make it an function to avoid repeating the same procedure again and again :D => simplify the code, don't repeat yourself

	return $.html(table);
};

/**
 * Detects if element is a responsive table or is a part of a responsive table
 * and adds some classes to mark them as "responsive" to be able to style them later
 * @param element (cheerio object)
 * @returns {boolean}
 */
Marker.prototype.markResponsive = function (element) {
	if (element.is('row') && element.is('[responsive]')) {
		element.addClass('responsive-table');
		return true;
	}
	else if (element.is('column') && element.closest('table').is('.responsive-table')) {
		element.addClass('responsive');
		return true;
	}
	return false;
};

/**
 * get the list of element attributes with its values
 * @param element (cheerio object)
 * @returns {object}
 */
Marker.prototype.getAttributes = function (element) {
	return element.get(0).attribs;
};

Marker.prototype.getAttrsAsText = function (element, all) {
	var self = this,
		attrs = this.getAttributes(element),
		text = '';

	var isAllowedAttribute = function (key) {
		if (all) {
			return true;
		}
		return self.allowedAttributes.indexOf(key) !== -1;
	};

	for (var key in attrs) {
		if (attrs.hasOwnProperty(key) && isAllowedAttribute(key)) {
			text += key + '="' + attrs[key] + '" ';
		}
	}

	return text;
};


module.exports = Marker;
