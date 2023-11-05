# iredb

Experimenting with Nix-style content-addressable stores for general
incremental recomputations behond build systems.

```
output        =   eval(input)
   |                  |
   |                  |
   v                  |
output_hash  <=   input_hash
```

## Store

```
store/
  <hash>-json: value
  <hash>-binary: value
  out:<hash>-json --> <outputHash>
```
