# Benchmark Results

All measurements in milliseconds. Tested in Chromium on the same machine, single run per framework with "Run All" button.

| Operation    | React  | Vue    | Svelte | Angular |
| ------------ | ------ | ------ | ------ | ------- |
| Render 100   | 110.20 |  77.40 |  42.80 |  101.20 |
| Render 500   | 183.60 |  88.50 | 293.30 |  175.20 |
| Render 1000  | 132.30 | 293.40 | 146.60 |  215.70 |
| Update 50    | 132.00 |  34.20 |  33.40 |   56.10 |
| Delete 50    | 681.40 |  36.90 |  31.40 |   36.90 |
