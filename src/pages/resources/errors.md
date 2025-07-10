---
title: "Statistical errors"
description: "Statistical errors"
layout: "../../layouts/MarkdownLayout.astro"
---

**Mean Absolute Error (MAE)**

$$
\text{MAE}=\frac{1}{n}\sum_{i=1}^n|y_i-\hat{y}_i|
$$

**Mean Squared Error (MSE)**

$$
\text{MSE}=\frac{1}{n}\sum_{i=1}^n\left(y_i-\hat{y}_i\right)^2
$$

**Residual Sum of Squares (RSS)**

$$
\text{RSS}=\sum_{i=1}^n\left(y_i-\hat{y}_i\right)^2
$$

**Root Mean Square [Error/Deviation] (RMSE, RMS)**

$$
\text{RMS}=\sqrt{\frac{1}{n}\sum_{i=1}^n x_i^2}
$$

$$
\text{RMSD}=\sqrt{\text{MSE}}=\sqrt{\frac{1}{n}\sum_{i=1}^n\left(y_i-\hat{y}_i\right)^2}
$$

**Mean Absolute Percentage Error (MAPE)**

$$
\text{MAPE}=\frac{100\%}{n}\sum_{i=1}^n\left|\frac{y_i-\hat{y}_i}{y_i}\right|
$$

| MAPE   | Interpretation              |
| ------ | --------------------------- |
| <10%   | Highly accurate forecasting |
| 10-20% | Good forecasting            |
| 20-50% | Reasonable forecasting      |
| >50%   | Inaccurate forecasting      |

(Lewis, 1982, p.40)

**Mean Square Percentage Error (MSPE)**

$$
\text{MSPE}=\frac{1}{n}\sum_{i=1}^n\left(\frac{\hat{y_i}-y_i}{y_i}\right)^2
$$

**Root Mean Square Percentage Error (RMSPE)**

Swanson et al., [Fomby](https://s2.smu.edu/tfomby/eco5385_eco6380/lecture/Scoring%20Measures%20for%20Prediction%20Problems.pdf), [Shcherbakov et al.](<https://idosi.org/wasj/wasj(ITMIES)13/28.pdf>)

$$
\text{RMSPE}=\sqrt{\text{MSPE}}=\sqrt{\frac{1}{n}\sum_{i=1}^n\left(\frac{\hat{y_i}-y_i}{y_i}\right)^2}
$$

**Mean Absolute Scaled Error (MASE)**

$$
\text{MASE}=\frac{\text{MAE}}{Q}
$$

with $Q$ as scaling constant.

**Median Absolute Deviation (MAD)**

$$
\text{MAD}=\text{median}\left(|y_i-\text{median}(y)|\right)
$$

**Symmetric Mean Absolute Percentage Error (sMAPE)**

$$
\text{sMAPE}=\frac{100}{n}\sum_{i=1}^{n}\frac{|\hat{y}_i-y_i|}{(|y_i|+|\hat{y}_i|)/2}
$$

## Resources

- [darts Metrics](https://unit8co.github.io/darts/generated_api/darts.metrics.metrics.html)
