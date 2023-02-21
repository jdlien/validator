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
