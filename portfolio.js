// A best-practice is to wrap our work within a function.
(function($) {
    // Wait for page to be ready.
    $(function() {
        // Fetch remote data together.
        var countryPromise = $.ajax('https://raw.githubusercontent.com/marcparmet/portfolio/master/Country.json');
        var currencyCodePromise = $.ajax('https://raw.githubusercontent.com/marcparmet/portfolio/master/CurrencyCode.json');
        var portfolioPromise = $.ajax('https://raw.githubusercontent.com/marcparmet/portfolio/master/portfolio.json');
        var exchangeRatePromise = $.ajax('https://openexchangerates.org/api/latest.json?app_id=925b5c034e404a678862b0ea49a2fab6');

        // Wait for all fetches to complete.
        $.when(countryPromise, currencyCodePromise, portfolioPromise, exchangeRatePromise)
            .done(function(countryResult, currencyCodeResult, portfolioResult, exchangeRateResult) {
                var countryData = $.parseJSON(countryResult[0]);
                var currencyCodeData = $.parseJSON(currencyCodeResult[0]);
                var portfolioData = $.parseJSON(portfolioResult[0]);
                var exchangeRateData = exchangeRateResult[0];

                // Build an index for country data by country code.
                var countryDataIndex = {};
                $.each(countryData, function(undefined, country) {
                    countryDataIndex[country.code] = country;
                });

                // Build an index for currency code data by currency code.
                var currencyCodeDataIndex = {};
                $.each(currencyCodeData, function(undefined, currency) {
                    currencyCodeDataIndex[currency.isoCode] = currency;
                });

                // Compute the total intrinsic value of each person's portfolio.
                $.each(portfolioData.portfolios, function(undefined, person) {
                    person.totalIntrinsicValue = 0;
                    $.each(person.fxAssets, function(undefined, asset) {
                        var exchangeRate = exchangeRateData.rates[asset.currencyCode];
                        if (!exchangeRate) {
                            console.warn('Exchange rate not found: ', asset.currencyCode);
                            return;
                        }
                        var assetIntrinsicValue = asset.amount / exchangeRate;
                        person.totalIntrinsicValue += assetIntrinsicValue;
                    });
                });

                // Sort portfolios by total intrinsic value.
                portfolioData.portfolios.sort(function(a, b) {
                    return b.totalIntrinsicValue - a.totalIntrinsicValue;
                });

                // Render person, country, and portfolio value in home currency.
                $.each(portfolioData.portfolios, function(index, person) {
                    var country = countryDataIndex[person.countryCode];
                    if (!country) {
                        console.warn('Country not found: ', person.countryCode);
                        return;
                    }

                    var homeCountryCurrency = currencyCodeDataIndex[country.currencyCode];
                    if (!homeCountryCurrency) {
                        console.warn('Currency not found: ', country.currencyCode);
                        return;
                    }

                    var exchangeRateHomeCountry = exchangeRateData.rates[country.currencyCode];
                    var homeCountryValue = person.totalIntrinsicValue * exchangeRateHomeCountry;

                    $('tbody').append($('<tr>').append(
                        $('<td>').text(index+1),
                        $('<td>').text(person.name),
                        $('<td>').text(country.name),
                        $('<td class="intrinsic">').text(person.totalIntrinsicValue.toFixed(2)),
                        $('<td class="home-value">').text(homeCountryValue.toFixed(2)),
                        $('<td class="home-currency">').text(homeCountryCurrency.name)));
                });
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.error('Network call failed');
            });
    });
})(jQuery);
