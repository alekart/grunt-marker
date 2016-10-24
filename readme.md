# Grunt Marker (custom HTML element tags for building emails)

Inspired by ZURB Inky, light, responsive and bulletproof version.
---
Marker module simplifies the way you write code for e-mails. It introduces a simplified markup that is converted to the e-mail friendly HTML.

- [Tables](https://github.com/alekart/grunt-marker#tables)
- [Lists](https://github.com/alekart/grunt-marker#lists-ulol--li)
- [Buttons](https://github.com/alekart/grunt-marker#buttons)

---

## Tables

```html
<row>
	<column>column content</column>
	<column>column content</column>
</row>
```
Output: 
```html
<table class="row">
	<tbody>
	<tr>
		<td class="column first">column content</td>
		<td class="column last">column content</td>
	</tr>
	</tbody>
</table>
```

Any attributes applied on `row` tag will be transfered on `table` tag,       			
attributes on `column` tag on `td`.

### MSO conditionned table

Add the `responsive` attribute on `row` tag and it will output a table/div html with `<!--[if mso]-->` and `<!--[if !mso]>` comments.

```html
<row responsive>
	<column>column content</column>
	<column>column content</column>
</row>
```
Output:
```html
<!--[if !mso]><!----><div class="row responsive-table mso"><!-- <![endif]-->
	<!--[if mso]><table class="row responsive-table mso"><tbody><![endif]--><!--[if mso]><tr><![endif]-->
		<!--[if mso]><td class="column first responsive"><![endif]-->
			<!--[if !mso]><!----><div class="column first responsive"><!-- <![endif]-->column content<!--[if !mso]><!----></div><!-- <![endif]-->
		<!--[if mso]></td><![endif]-->
		<!--[if mso]><td class="column last responsive"><![endif]-->
			<!--[if !mso]><!----><div class="column last responsive"><!-- <![endif]-->column content<!--[if !mso]><!----></div><!-- <![endif]-->
		<!--[if mso]></td><![endif]-->
<!--[if mso]></tr><![endif]--><!--[if mso]></tbody></table><![endif]--><!--[if !mso]><!----></div><!-- <![endif]-->
```

## Lists (ul/ol + li)
Just write your lists as you always do Marker will convert it into structured tables for bulletproof usage in e-mails.

### ul
Code:
```html
<ul>
	<li>item</li>
	<li>item</li>
</ul>
```
Output:
```html
<table class="ul list"><tbody>
	<tr class="li-item"><td class="li li-bullet">&#x2022;</td><td class="li li-content">item</td></tr>
	<tr class="li-item"><td class="li li-bullet">&#x2022;</td><td class="li li-content">item</td></tr>
</tbody></table>
```
### ol

Code: 
```html
<ol>
	<li>item</li>
	<li>item</li>
</ol>
```
Output:
```html
<table class="ol list"><tbody>
	<tr class="li-item"><td class="li li-bullet">1.</td><td class="li li-content">item</td></tr>
	<tr class="li-item"><td class="li li-bullet">2.</td><td class="li li-content">item</td></tr>
</tbody></table>
```

### Parameters (attributes)
All attributes are transferred:
- from `ul`/`ol` tag to `table`
- from `li` tag to `tr`

#### Spacial attributes for configuration (ul only)

- `bullet` allows to define a specific bullet symbol or an image
	- **image** `bullet="path/to/the/image.png"`. We recommend to use it with `bullet-alt` attribute.
	- symbol/character `bullet=">"`
- `bullet-alt` allows to provide the `alt` attribute for the bullet image, so your list will have bullets if images are not displayed
```html
	<ul bullet="path/to/the/image.png" bullet-alt=">"><li>item</li><ul>
```
```html
	<table bullet="img/path/image.png" bullet-alt="&gt;" class="ul list"><tbody>
	<tr class="li-item"><td class="li li-bullet"><img src="path/to/the/image.png" alt="&gt;"></td><td class="li li-content">item</td></tr>
	</tbody></table>
```

## Buttons
Bulletproof buttons using old Microsoft VLM vectors (depreciated in web today but still used in the Ms Office)

Code:
```html
<btn-vml class="btn btn-default" href="#" collorfill="#CCCCCC">btn-default</btn-vml>
```
Output: 
```html
<div class="btn btn-default">
	<!--[if mso]><v:roundrect btnvlm xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" class="btn btn-default" href="#" collorfill="#CCCCCC" ><w:anchorlock/><center>btn-default</center></v:roundrect><![endif]-->
	<a href="#">btn-default</a>
</div>
```

### VML RoundRect Atributes
- **colorfill** {hex color}: sets the background color of the v:roundrect element
- **arcsize** {%}: sets the corner radius of the v:roundrect element (in percents)
- **stroked="false"**: removes the border of the v:roundrect element
- **strokecolor** {hex color}: sets the color of the border of the v:roundrect element
- **strokeweight** {pt}: border width in points (pt)

**Full doc: https://msdn.microsoft.com/en-us/library/documentformat.openxml.vml.roundrectangle(v=office.14).aspx**

### Button SCSS:
```scss
.btn {
	[btnvml] {
		height: $height;
		width: $width;
		font-size: $font-size;
		v-text-anchor: middle;
	}
	center {
		font-family: $font-family;
		font-weight: $btn-font-weight;
		color: $btn-default-color;;
	}
	a {
		display: inline-block;
		width: $width;
		padding: $padding-vertical $padding-horizontal;
		border-radius: $border-radius;
		font-size: $font-size;
		line-height: $height;
		color: $btn-default-color;
		font-family: $font-family;
		font-weight: $btn-font-weight;
		text-align: center;
		text-decoration: none;
		-webkit-text-size-adjust: none;
		mso-hide: all;
		background-color: $background;
	}
}

```