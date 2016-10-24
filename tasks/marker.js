/*
 * grunt-marker
 * Copyright (c) 2016 Aleksei Polechin (alek´)
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

	grunt.registerMultiTask('marker', 'Light and more "responsive" module inspired by ZURB inky', function () {

		var options = this.options({
			columns: 12,
			components: [
				'row',
				'column',
				'btn-vml',
				'ul',
				'ol',
				'li'
			],
			templates: {
				row: '<table><tbody><tr>%content%</tr></tbody></table>',
				column: '<td>%content%</td>',
				ul: '<table><tbody>%content%</tbody></table>',
				ol: '<table><tbody>%content%</tbody></table>',
				li: '<tr><td></td><td>%content%</td></tr>'
			}
		});

		// Load plugins
		var Marker = require('./lib/marker.js');

		var marker = new Marker(options);

		var done = this.async(),
			max = this.filesSrc.length,
			index = 0,
			markedHtml,
			isFinished = function () {
				index++;

				if (index === max) {
					done();
				}
			},
			unixifyPath = function (filepath) {
				if (process.platform === 'win32') {
					return filepath.replace(/\\/g, '/');
				} else {
					return filepath;
				}
			},
			detectDestType = function (dest) {
				if (grunt.util._.endsWith(dest, '/')) {
					return 'directory';
				} else {
					return 'file';
				}
			};

		// Iterate over all specified file groups.
		this.files.forEach(function (filePair) {
			var isExpandedPair = filePair.orig.expand || false,
				destination = unixifyPath(filePair.dest),
				cheerio = require('cheerio'),
				path = require('path'),
			fs = require('fs');

			filePair.src.forEach(function (file) {
				file = unixifyPath(file);

				if (detectDestType(destination) === 'directory') {
					destination = isExpandedPair ? destination : path.join(destination, file);
				}

				// load the HTML from the file
				var html = grunt.file.read(file);

				// make the tags transformation for the loaded file
				markedHtml = marker.markThemUp(html);

				grunt.log.writeln('File ' + file + ' has been done');
			});

			// Create folder if not exists
			grunt.file.mkdir(path.dirname(destination));

			// Write the destination file.
			fs.writeFile(destination, markedHtml, function () {
				grunt.log.writeln('Successfully wrote ' + destination + '.');
				isFinished();
			});
		});
	});

};
