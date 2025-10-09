const sheetUrl = `https://docs.google.com/spreadsheets/d/1TL3vuE5755EJrA-0BbNbMTvCDm-t-MHiwbegwoZpe7Y/gviz/tq?tqx=out:json`;
var allCards = []
var properties = []
var artists = ['-', 'any art', 'no art']

document.addEventListener('DOMContentLoaded', () => {
    
    function createCard(card) {
        const cardId = card.name.replaceAll("-", "").replaceAll(" ", "-").replaceAll(",", "").replaceAll("'", "").replaceAll("$", "").toLowerCase()
        const cardQuote = card.quote ? `"${card.quote}"` : ""
        const cardArtist = card.artist ? `illus. ${card.artist}` : ""
        const breaking = card.otherAttributes ? card.otherAttributes.includes('breaking') ? `breaking` : "" : ""
        function format(input) {
            return input
            .replaceAll("((", "br1")
            .replaceAll("))", "br2")
            .replaceAll("~", "</span><span class=\"aside\">")
            .replaceAll("(", "<span class=\"outcome\">")
            .replaceAll(")", "</span>")
            .replaceAll("[", "<span class=\"outcomeGroup\">")
            .replaceAll("]", "</span>")
            .replaceAll(">>", "<span class=\"squish\">")
            .replaceAll("<<", "</span>")
            .replaceAll("d1", "<span class=\"dice\">&#9856;</span>")
            .replaceAll("d2", "<span class=\"dice\">&#9857;</span>")
            .replaceAll("d3", "<span class=\"dice\">&#9858;</span>")
            .replaceAll("d4", "<span class=\"dice\">&#9859;</span>")
            .replaceAll("d5", "<span class=\"dice\">&#9860;</span>")
            .replaceAll("d6", "<span class=\"dice\">&#9861;</span>")
            .replaceAll("br1", "(")
            .replaceAll("br2", ")")
            .replaceAll("OR", "<div class=\"orBox\">OR</div>")
            .replaceAll("escorted", "<span class=\"keyword\">escorted</span>")
            .replaceAll("escort", "<span class=\"keyword\">escort</span>")
        }
        var $card = $(`
        <div id="${cardId}" class="card ${card.rarity}">
            <div class="cardBg ${card.rarity}"></div>
            <img class="cardImage ${breaking}" src="https://raw.githubusercontent.com/galadinowo/chaoschess/refs/heads/main/images/cards/${card.artStatus === 'FINISHED' ? cardId : 'placeholder'}.png">
            <div class="cardClass">${card.class}</div>
            <div class="cardName">${card.name}</div>
            <div class="cardDesc">${format(card.desc)}</div>
            <div class="cardQuote aside">${cardQuote}</div>
            <div class="cardArtist aside">${cardArtist}</div>
            <div class="cardValue">val: ${card.val}</div>
        </div>
        `);
        $card.find('.outcome').each(function() {
            $(this).children('.dice').wrapAll("<div class='outcomeDice'></div>")
        });
        $card.on('click', function() {
            const elementToCapture = $(this)[0];
            html2canvas(elementToCapture, {scale: 5, backgroundColor: null, useCORS: true,}).then(canvas => {
                var context = canvas.getContext('2d');
                context.imageSmoothingEnabled = false;
                const $tempLink = $('<a>');
                $tempLink.attr('href', canvas.toDataURL('image/png'));
                $tempLink.attr('download', `${$(this).attr('id')}.png`);
                $('body').append($tempLink);
                $tempLink[0].click();
                $tempLink.remove();
            });
        });
        $('body').append($card);
    }
    
    function printCards() {
        $(".card").remove();
        var count = 0;
        var search = $('#cardSearch').val()
        var classe = $('#cardClass').val()
        var rarity = $('#cardRarity').val()
        var value = $('#cardValue').val()
        var sign = $('#cardValueSign').val()
        var sort = $('#cardSort').val()
        var m = $('#cardM').is(":checked")
        var k = $('#cardK').is(":checked")
        var artist = $('#cardArt').val()
    
        const sortedAllCards = allCards.sort(function(a, b) {
            switch (sort) {
                case "alphabetical": return a.name.localeCompare(b.name);
                case "value": return b.val - a.val;
                case "reverse value": return a.val - b.val;
                case "random": return Math.random() - 0.5;
            }
        });
    
        sortedAllCards.forEach((card) => {
            var allowed = true;
            var searchableString = card.name + card.desc + card.quote
            searchableString = searchableString.toLowerCase()
            search = search.toLowerCase()
            allowed = searchableString.includes(search)
            if (allowed) {
                allowed = classe === "all classes" || card.class === classe
            }
            if (allowed) {
                allowed = rarity === "all rarities" || card.rarity === rarity
            }
            if (allowed && m) {
                allowed = card.tags.split(" ").includes("M")
            }
            if (allowed && k) {
                allowed = card.tags.split(" ").includes("K")
            }
            if (allowed) {
                const hasArtist = typeof card.artist !== 'undefined'
                allowed = artist === "-" || (hasArtist && artist === "any art") || (!hasArtist && artist === "no art") || card.artist === artist
            }
            if (allowed && value) {
                switch (sign) {
                    case "=": allowed = card.val === value; break;
                    case ">": allowed = card.val <= value; break;
                    case "<": allowed = card.val >= value; break;
                }
            }
            if (allowed) {
                createCard(card)
                count++
            }
        });
        $('#cardCount').html(`count: ${count} / ${allCards.length}`);
    }
    
    fetch(sheetUrl)
        .then(response => response.text())
        .then(data => {
            data = JSON.parse(
                data.replace(/(^\/\*O_o\*\/\ngoogle\.visualization\.Query\.setResponse\(|\);$)/g,'')
            );
            console.log(data.table);
            allCards = data.table.rows
            data.table.cols.forEach((col) => properties.push(col.label));
            allCards.forEach((card, i, arr) => {
                var cardTransformed = {};
                card.c.forEach((propObj, i) => {
                    if (propObj !== null) {
                        cardTransformed[properties[i]] = propObj.v
                    } else {
                        cardTransformed[properties[i]] = ""
                    }
                });
                arr[i] = cardTransformed
            });
            allCards.forEach((card) => {
                if (!artists.includes(card.artist) && card.artist) {
                    artists.push(card.artist)
                }
            });
        })
        .then(() => {
            const $searchContainer = $('<div id="searchContainer"></div>')
            const $search = $('<input type="text" id="cardSearch" placeholder="search...">').on("input", function() {
                printCards();
            });
            const $class = $('<select id="cardClass"> <option>all classes</option> <option>ITEM!</option> <option>EQUIP!</option> <option>EFFECT!</option> </select>').on("input", function() {
                printCards();
            });
            const $rarity = $('<select id="cardRarity"> <option>all rarities</option> <option>common</option> <option>rare</option> <option>epic</option> <option>superior</option> </select>').on("input", function() {
                printCards();
            });
            const $value = $('<input type="text" id="cardValue" placeholder="value...">').on("input", function() {
                printCards();
            });
            const $valuesign = $('<select id="cardValueSign"> <option>=</option> <option>></option> <option><</option></select>').on("input", function() {
                printCards();
            });
            const $sort = $('<select id="cardSort"> <option>alphabetical</option> <option>value</option> <option>reverse value</option> <option>random</option></select>').on("input", function() {
                printCards();
            });
            const $m = $('<label for="cardM">moves</label><input type="checkbox" id="cardM">').on("input", function() {
                printCards();
            });
            const $k = $('<label for="cardK">keepsakes</label><input type="checkbox" id="cardK">').on("input", function() {
                printCards();
            });
            const $cardArt = $('<select id="cardArt"></select>').on("input", function() {
                printCards();
            });
                artists.forEach((artist) => {
                    $cardArt.append($('<option>', { text: artist }));
                });
            const $count = $('<span id="cardCount"></span>')
            $searchContainer.append($class).append($search).append($rarity).append($value).append($valuesign).append($m).append($k).append($cardArt).append($count).append($sort)
            $('body').append($searchContainer)
            printCards();
        });
});
