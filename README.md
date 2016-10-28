# aktionJS

## Create complex interactions only in HTML5 and CSS3

Long story short, it's simply:

```html
<div>Class comes here!</div>
<button data-aktion-value="newClass" 
        data-aktion-destination-selector="div">
        Click me and I will add a class to the div!
<button>

<!-- Results -->
<div class="newClass">Class comes here!</div>
```

or:

```html
<div class="changeMe">Change my visibility please!</div>
<button data-aktion-value="hidden" 
        data-aktion-type="toggle"
        data-aktion-destination-selector=".changeMe">
        Click me and I will change the visibility of that div!
<button>

<!-- Toggles -->
<div class="changeMe hidden">Change my visibility please!</div>
```