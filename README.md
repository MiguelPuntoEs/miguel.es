# miguel.es

Miguel González Calvo's personal website, currently deployed on [miguel.es](https://www.miguel.es)

## Userful commands

Preview:
```
quarto preview
```

Publish:
```
quarto publish
```

In order to run `quarto publish`, there should be a file `_publish.yml` as follows:

```yaml
- source: project
  netlify:
    - id: [netlify-id]
      url: https://www.miguel.es
```

See official Quarto documentation for [Netlify publishing](https://quarto.org/docs/publishing/netlify.html).