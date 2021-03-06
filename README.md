# aktionJS

## Create complex interactions only in HTML5 and CSS3
### _(for sitebuilders who don't plan to understand a single line of javascript ever)_

Long story short, it's simply:

```html
<button data-aktion-value="newClass">Click me and my class will change!</button>

<!-- Results -->
<button data-aktion-value="newClass" class="newClass">Click me and my class will change!</button>
```

or:

```html
<div>Class comes here!</div>
<button data-aktion-value="newClass" 
        data-aktion-destination-selector="div">
        Click me and I will change the class of the div!
<button>

<!-- Results -->
<div class="newClass">Class comes here!</div>
```

or:

```html
<div class="changeMe hidden">I'm visible!</div>
<button data-aktion-value="hidden" 
        data-aktion-type="remove"
        data-aktion-event="mouseover"
        data-aktion-destination-selector=".changeMe">
        Hover me and I will show that div!
<button>

<!-- Toggles -->
<div class="changeMe">I'm visible!</div>
```

[Check out some cool examples!](#wanna-play-with-some-cool-examples)

The only thing you have to do to make it come true is:

```html
<script src="aktion.min.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        var aktion = new Aktion();
    });
</script>
```

### How does it work?
#### The basics

First of all choose an HTML element you want to make interactive! You must determine a _"source"_ and a _"destination"_ HTML element first. It means you want to invoke an action to the _destination_ by doing something on the _source_. Let's say you have a button! That's your _source_. Sources are defined by the **data-aktion-soure-selector** HTML attribute with a valid CSS selector. According to the nature of CSS selectors, _source_ (and _destination_) can represent one or more DOM elements. The _destination_ is defined by **data-aktion-destination-selector**. It's like:

```html
<button
    data-aktion-source-selector="button"
    data-aktion-destination-selector="button">
    I'm the "source"
</button>
```

Of course in this case you can omit source or destination attributes. If you don't want to use **data-aktion-source-selector**, it means the _source_ is automatically the button element itself.

```html
<button
    data-aktion-destination-selector=".destination-element">
    I'm the "source"
</button>
<div class="destination-element"></div>
```

If you omit **data-aktion-destination-selector** attribute, it means the _destination_ is automatically selected by **data-aktion-source-selector** (in this case the button itsef, because source selector is also omitted).

```html
<button>
    I'm the "source" and the "destination"
</button>
```

OK. Let's do something real with that _destination_, giving a class to it for example. In the _source_, **data-aktion-attribute** determines the _destination's_ HTML attribute which will be affected by the invoked action. It should be the "class" value in our case. _Source's_ **data-aktion-value** contains the value which will be given to _destination_ someway. Now it's the name of the class ("newClass").

```html
<button
    data-aktion-attribute="class"
    data-aktion-value="newClass"
    data-aktion-destination-selector=".destination-element">
    I'm the "source"
</button>
<div class="destination-element"></div>

<!-- Click on the button results -->
<div class="destination-element newClass"></div>
```

Because the default **data-aktion-attribute** is "class", omitting that will result the same in the example above. As you may notice the class name not only added but also removed when button was clicked. This effect originates from the **data-aktion-type** attribute which has the _"toggle"_ default value. So if I only want to add that class name for the first time when action is invoking and don't need toggling effect later, it looks like:

```html
<button
    data-aktion-type="add"
    data-aktion-value="newClass"
    data-aktion-destination-selector=".destination-element">
    I'm the "source"
</button>
```

But what can I do if I want to associate aktions with events other than _"click"_? A _"mouseover"_ for example, or some custom events? It's possible with the **data-aktion-event** attribute where you can set any kind of native javascript events and custom events provided by aktionJS.

```html
<ul class="list"
    data-aktion-source-selector=".list li"
    data-aktion-value="hovered"
    data-aktion-event="mouseover">
    <li>Item 1</li>
    <li>Item 1</li>
    <li>Item 1</li>
    <li>Item 1</li>
    <li>Item 1</li>
    <li>Item 1</li>
</ul>
```

#### Advanced usage
##### Wanna play with some cool examples?

- [Simple button #1 - toggle class]
- [Simple button #2 - data-aktion-type demo]
- [Selector demo #1 - data-aktion-destination-selector demo]
- [Selector demo #2 - data-aktion-source-selector demo]
- [Custom event demo #1 - custom scroll events]

### Available data-aktion-* attributes

- **data-aktion-name**: Unique action name _(default: autogenerated)_
- **data-aktion-type**: Action type _(can be: 'set'|'toggle'|'add'|'remove'|'trigger-event', default: 'toggle')_
- **data-aktion-value**: String value which will affect the attribute value of the destination DOM element(s) **_(required)_**
- **data-aktion-value-type**: The attribute value of the destination DOM element(s) can be a _"static"_ string, or the name of an _"attribute"_ of the source DOM element which stores the value _(can be 'static'|'attribute')_
- **data-aktion-event**: Native/custom event fires up action _(default: 'click')_
- **data-aktion-event-threshold**: Custom event _(swipe)_ threshold value in pixels _(default: 10)_
- **data-aktion-source-selector**: A valid DOM selector which determines the source DOM element(s) _(default: this)_
- **data-aktion-destination-selector**: A valid DOM selector which determines the destination DOM element(s) _(default: this)_
- **data-aktion-trigger-before**: Action will trigger before this named action, which has the same source selector _(default: false)_
- **data-aktion-trigger-after**: Action will trigger after this named action, which has the same source selector _(default: false)_
- **data-aktion-attribute**: The attribute of the destination DOM element, which will be affected _(default: 'class')_
- **data-aktion-interval-time**: Time of the function calling interval (in milliseconds). Currently used at custom scroll event checking _(default: 100)_
- **data-aktion-extra-condition**: Function name which determines extra condition for the execution of the action _(default: true)_

### Custom events provided by aktionJS
_(can be used in data-aktion-event attribute)_
- **scroll-start**: Scrolling has been started
- **scroll-stop**: Scrolling has been stopped
- **scroll**: Scrolling is in progress
- **scroll-up**: Scrolling up is in progress
- **scroll-down**: Scrolling down is in progress
- **scroll-dir-change**: The direction of the scrolling has been changed
- **scroll-dir-change-up**: The direction of the scrolling has been changed to up
- **scroll-dir-change-down**: The direction of the scrolling has been changed to down
- **scroll-reached-top**: The scrolled element has reached its top position
- **scroll-reached-bottom**: The scrolled element has reached its bottom position
- **swipeup**: Event triggers when element has been swiped up (by touch)
- **swipedown**: Event triggers when element has been swiped down (by touch)
- **swipeleft**: Event triggers when element has been swiped left (by touch)
- **swiperight**: Event triggers when element has been swiped right (by touch)
- **anim-end**: Event triggers when CSS3 animation of the source element has ended
- **trans-end**: Event triggers when CSS3 transition of the source element has ended

### Custom data-aktion-source-selectors

- **window**: The window DOM object
- **document**: The document DOM object

### Known limitations/issues

- **data-aktion-type="trigger-event"** cannot trigger scroll events (because those are not classical events)
- Event delegation is attached to **"body"** DOM element (not document)

[Simple button #1 - toggle class]: <https://jsfiddle.net/megant/c1y7d9k1/>
[Simple button #2 - data-aktion-type demo]: <https://jsfiddle.net/megant/x8eLyrdz/>
[Selector demo #1 - data-aktion-destination-selector demo]: <https://jsfiddle.net/megant/jLjdztja/>
[Selector demo #2 - data-aktion-source-selector demo]: <https://jsfiddle.net/megant/0qo0c8wo/>
[Custom event demo #1 - custom scroll events]: https://jsfiddle.net/megant/xg6kskkz/