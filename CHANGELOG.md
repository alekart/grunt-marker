#0.2.0
- important **breaking** change: <button> tag is now <btn-vml>
- internal: remove `getAttrsAsText` method
- internal: refactor and improve `getAttrbuteAsText` method du to removing the `getAttrsAsText` method

#0.1.13
- fix #3 dyslexic problem :D

#0.1.12
- fix useless debug output while processing

#0.1.11
- **fix** Avoid the htmlentities to be encoded

#0.1.10
- **fix** The button element HTML structure reviewed and fixed

#0.1.9
- **fix** Do not alter nested tables inside a responsive table

#0.1.8
- mega fix for conditional tables. No more repetition

#0.1.7
- no more container tag: now use `<row><column></column></row>` instead. Ros is now transformed into the table 
- conditional comments are back and fixed
- added <button> tag transformation into bulletproof email html button

#0.1.6
- fix the marker html() method after removing the comments

#0.1.5
- remove conditional comments adding moved to another module

#0.1.4
- remove clear divs and table in responsive table

# v0.1.2
- add cheerio as dependency