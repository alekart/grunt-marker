var cheerio = require('cheerio');

function Marker(options) {
	this.options = options;
	this.components = this.options.components;
	this.templates = this.options.templates;

	// ignored attributes that should not be added to the replacement tag
	this.ignoreAttributes = ['responsive', 'small', 'large', 'bullet', 'bullet-alt'];
}

/**
 * Main method to process on html file content
 * @param file (html from loaded file)
 * @returns {string} ready to write into a file html code
 */
Marker.prototype.markThemUp = function (file) {
	var tags = this.components.join(', '),
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

	return $.html;
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
		case 'container':
			return self.tagMarker(element);

		case 'row':
			element.addClass('row');
			return self.tagMarker(element);

		case 'column':
			element.addClass('column');
			return self.markColumn(element);

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
			if (element.closest('.ol').length){
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
 * @param html (string)
 * @param tag (string)
 * @returns {string}
 */
Marker.prototype.addMsoConditions = function (html) {
	var $ = cheerio.load(html),
		table = $('table.responsive-table:not(.mso)');
	table.addClass('mso');

	if (!table)
		return $.html();
	var tagHtml = cheerio.html(table),
		//clearDiv = '',
		//tableWrapOpen = '',
		//tableWrapClose = '';

	tagHtml = tagHtml
	// open table/div then close div/table
		.replace(/(<table(.*(responsive-table).*)><tbody>)/g,
			'<!--[if mso]>$1<![endif]--><!--[if !mso]><!----><div $2>\n<!-- <![endif]-->')
		.replace(/(<\/tbody><\/table>)/g,
			'<!--[if !mso]><!----></div><!-- <![endif]--><!--[if mso]>$1<![endif]-->')

	// open tr/div then close div/tr
		.replace(/(<tr([^>]*)>)/g,
			'<!--[if mso]>$1<![endif]--><!--[if !mso]><!----><div $2>\n<!-- <![endif]-->')
		.replace(/<\/tr>/g,
			'<!--[if !mso]><!----></div><!-- <![endif]--><!--[if mso]></tr><![endif]-->')

	// open td/div then close div/td
		.replace(/(<td([^>]*)>)/g,
			'<!--[if mso]><td$2><![endif]--><!--[if !mso]><!----><div$2>\n<!-- <![endif]-->')
		.replace(/<\/td>/g,
			'<!--[if !mso]><!---->\n</div><!-- <![endif]--><!--[if mso]></td><![endif]-->')

	// remove spaces between comments, if div elements are in display: inline-block
		.replace(/(<!\[endif]-->[^<]*<!--\[if mso]>)/g, "<![endif]--><!--[if mso]>");

	// place row wrapper to cancel float propagation on the Gmail App (Android)
	//	.replace(/<rtw>/g, '<table class="rtw"><tr><td>').replace(/<\/rtw>/g, '</td></tr></table>');

	//tagHtml += clearDiv; // style this div to clear the float arguments if your divs are in float

	table.replaceWith(tagHtml);

	return $.html();
};

/**
 * Detects if element is a responsive table or is a part of a responsive table
 * and adds some classes to mark them as "responsive" to be able to style them later
 * @param element (cheerio object)
 * @returns {boolean}
 */
Marker.prototype.markResponsive = function (element) {
	if (element.is('container') && element.is('[responsive]')) {
		element.addClass('responsive responsive-table');
		return true;
	}
	else if (element.is('row') && element.closest('table').is('.responsive-table')) {
		element.addClass('responsive');
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

module.exports = Marker;
