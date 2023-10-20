const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const moment = require('moment');

function run(inputFilePath, outputFilePath) {
  try {
    // load and parse input file
    const inputContent = fs.readFileSync(inputFilePath, 'utf8');
    const $ = cheerio.load(inputContent);

    // extract and sort data from input file
    let obsessions = [];

    $('section.year').each(function() {
        let year = { year: $(this).find('h1').text().trim(), entries: [] }

        $(this).find('.obsession').each(function() {
            const date = $(this).find('h3').text().trim();
            const items = $(this).find('li').map(function() {
                return $(this).text().trim();
            }).get();

            const entry = {
                date: date,
                category: items[0],
                activity: items[1],
                description: items[2]
            };

            year.entries.push(entry);
        });

        year.entries.sort((a, b) => moment(a.date, 'MMMM D[,] YYYY') - moment(b.date, 'MMMM D[,] YYYY'));
        obsessions.push(year)        
    });

    obsessions.sort((a, b) => a.year - b.year);

    // load css markup
    const cssMarkup = `<style>\n${fs.readFileSync('src/css/calendar.css', 'utf8')}\n</style>`

    // build html markup
    let htmlMarkups = []
    let activity = ""

    for (const calendar of obsessions) {
      const startDate = moment(`January 1, ${calendar.year}`, 'MMMM D, YYYY');
      const endDate = moment(`December 31, ${calendar.year}`, 'MMMM D, YYYY');

      markup = `<div class="calendar">\n  <h3>${calendar.year}</h3>\n`;

      for (let day = startDate; day.isSameOrBefore(endDate); day.add(1, 'days')) { 
        const entry = calendar.entries.find(entry => {
          return moment(entry.date, 'MMMM D[,] YYYY').isSame(day);
        });

        if (entry) {
          activity = entry.activity.toLowerCase()
          markup += `  <div class="days ${activity}">Y</div>\n`;
        } else {
          markup += `  <div class="days ${startDate.isAfter(moment()) ? "" : activity }">N</div>\n`;
        }
      }

      markup += '</div>\n\n';

      htmlMarkups.push(markup)
    }

    // write output file
    resultHTML = `${cssMarkup}\n\n${htmlMarkups.reverse().join('')}`
    fs.writeFileSync(outputFilePath, resultHTML, 'utf8');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// cli
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Usage: obsession-calendar <input-file> <output-file>');
  process.exit(1);
}

const inputFilePath = path.resolve(args[0]);
const outputFilePath = path.resolve(args[1]);

run(inputFilePath, outputFilePath);