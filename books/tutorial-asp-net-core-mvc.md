# instapack + ASP.NET Core MVC

For this tutorial, we will not be using Visual Studio 2017, but use the command line tool provided by .NET Core SDK to setup, build, and run the project.

Install .NET Core SDK if you have not done so. https://www.microsoft.com/net/download/core

## Create Project

Create an empty folder, such as `E:\VS\MyWebApp` then run these commands inside the folder:

```cmd
dotnet new mvc
ipack new aspnet
```

Your folder structure should look like this:

```
├───client
│   ├───css
│   └───js
├───Controllers
├───node_modules
├───Views
│   ├───Home
│   └───Shared
└───wwwroot
    ├───css
    ├───images
    ├───js
    └───lib
```

## Cleaning Up

Because we are using NPM for managing our packages and `instapack` for bundling and minifying our project, we can delete some files and folders to reduce noise and clutter:

- /.bowerrc
- /bower.json
- /bundleconfig.json
- /wwwroot/lib/
- /wwwroot/js/
- /wwwroot/css/

Additionally, I also like to delete these files and start with something fresh later:

- /Views/Home/Index.cshtml
- /Views/Shared/_Layout.cshtml
- /Views/Shared/_ValidationScriptsPartial.cshtml

## Referencing Artefacts

Try running `instapack` / `ipack` in your command line. These following files will appear:

- /wwwroot/js/jquery-bootstrap.js
- /wwwroot/js/aspnet-validation.js
- /wwwroot/js/bundle.js
- /wwwroot/css/site.css

We need to reference those files. Our `/Views/Shared/_Layout.cshtml` should look like this:

```html
<!DOCTYPE html>

<html>
<head>
    <meta name="viewport" content="width=device-width" />
    <title>@ViewBag.Title</title>

    <link rel="stylesheet" href="~/css/site.css" />
</head>
<body>
    <div class="container">
        @RenderBody()
    </div>

    <script src="~/js/jquery-bootstrap.js"></script>
    <script src="~/js/aspnet-validation.js"></script>
    <script src="~/js/bundle.js"></script>
</body>
</html>
```

In this arrangement, the style sheets will be loaded first, then the HTML body, to allow progressive page rendering ahead of the JavaScript code.

The reason that the JavaScript files are referenced in that order, is because of the composition of each files:

- `jquery-bootstrap.js` = `jquery` + `bootstrap-sass` modules concatenation.
- `aspnet-validation.js` = `jquery-validation` + `jquery-validation-unobtrusive` modules concatenation, which depends on JQuery.
- `bundle.js` = `/client/js/index.ts` compilation, which may or may not use static JQuery instance from `window['$']` object.

Concatenations are defined in `package.json` and pulled straight from `node_modules`.

## Hello World

Let's make a `/Views/Home/Index.cshtml` file that looks like this:

```html
@{
    ViewBag.Title = "Index";
}

<h2>Index</h2>

<p id="hello"></p>
```

Let us create a very simple greeting. In `/client/js/index.ts`:

```ts
document.getElementById('hello').innerHTML = 'Hello World';
```

As you can see, TypeScript behaves just like a normal JavaScript. Compile and run the program by running these commands:

```cmd
ipack
dotnet restore
dotnet build
dotnet run
```

You should be able to access the page via your web browser at `http://localhost:5000/`.

If done correctly, `Hello World` text should appear under the `Index` header text.

Read more about TypeScript: https://www.typescriptlang.org/docs/home.html

> `instapack` provides rapid development mode that automatically builds on-change by using debug and watch flag: `ipack -dw`

## Imports and NPM

We can add libraries into our project from NPM gallery and consume them using `instapack`.

Try adding `comma-number` into our project via the command line: `yarn add comma-number`

Then modify our `index.ts` to:

```ts
import * as cn from 'comma-number';

document.getElementById('hello').innerHTML = cn(1337);
```

If done correctly, the view should display `1,337`.

> By using TypeScript `import` syntax, we can scale the JavaScript application into multiple files and let `instapack` deal with the build. [Read more](https://www.typescriptlang.org/docs/handbook/modules.html).

## StyleSheets

In `/client/css/site.scss`, add the following rule:

```css
#hello {
    color: red;
}
```

If done correctly, the text should turn red.

That's it. Basically it is still the very same CSS that you learn ~~and love~~, but much more powerful and convenient!

- SASS Basics: http://sass-lang.com/guide
- Learn SASS at Codecademy: https://www.codecademy.com/learn/learn-sass
- Learn SASS at Code School: https://www.codeschool.com/courses/assembling-sass

> `instapack` also performs browser compatibility fixes for vendor prefixes (like -moz-* or -webkit-* or -ms-*), for impressive compatibility with over 94% of the browsers in use worldwide!

## Icons

If you need vector icon font assets such as Bootstrap's Glyphicon, manually copy from package (`bootstrap-sass`) folder inside `node_modules` folder into the `wwwroot` folder.

Let's do an exercise, to add Font Awesome into the project, run this command from the project folder root:

`yarn add font-awesome`

Then navigate to `/node_modules/font-awesome/` folder then copy the `fonts` folder into the `/wwwroot` folder.

Now all we need to do is to add the CSS into our project. To do this, open `/client/css/site.scss` then add the following line:

```scss
// Resolves to /node_modules/font-awesome/scss/font-awesome.scss
@import 'font-awesome/scss/font-awesome';
```

Now you should be able to use Font Awesome icons in your views. Test by adding this snippet into your `/Views/Home/Index.cshtml`:

```html
<i class="fa fa-thumbs-up" aria-hidden="true"></i>
```

If done correctly, a thumbs-up icon should appear.

> Yes that's right, `instapack` automatically resolves `@import` from `node_modules` for your convenience!