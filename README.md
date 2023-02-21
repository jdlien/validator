## Contributing
Install dev dependencies:
```bash
npm install
```

You may get an error like
```
Module did not self-register: '...\node_modules\canvas\build\Release\canvas.node'
```

If that happens, you need to install the canvas module manually:
```bash
npm rebuild canvas --update-binary
```

Then you can run the tests:
```bash

If the error persists, this is likely a compatibility issue with newer versions of Node.
You should be able to work around this by setting threads to false in your vite.config.js file:
```js
test: {
    environment: "jsdom",
    threads: false,
  },
```
