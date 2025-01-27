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
            const items = $(this).find('li');

            const entry = {
                date: date,
                category: items.eq(0),
                activity: items.eq(1),
                description: items.eq(2)
            };

            year.entries.push(entry);
        });

        year.entries.sort((a, b) => moment(a.date, 'MMMM D[,] YYYY') - moment(b.date, 'MMMM D[,] YYYY'));
        obsessions.push(year)        
    });

    obsessions.sort((a, b) => a.year - b.year);

    const currentYear = moment().year();
    const lastRecordedYear = parseInt(obsessions[obsessions.length - 1].year);
    
    for (let year = lastRecordedYear + 1; year <= currentYear; year++) {
        obsessions.push({
            year: year.toString(),
            entries: []
        });
    }

    // load css markup
    const cssMarkup = `<style>\n${fs.readFileSync(path.join(__dirname, 'src/css/calendar.css'), 'utf8')}\n</style>`
    const jsMarkup = `<script>\n${fs.readFileSync(path.join(__dirname, 'src/js/tooltip.js'), 'utf8')}\n</script>`

    // build html markup
    let htmlMarkups = []
    let day = ""

    for (const calendar of obsessions) {
      const startDate = moment(`January 1, ${calendar.year}`, 'MMMM D, YYYY');
      const endDate = moment(`December 31, ${calendar.year}`, 'MMMM D, YYYY');

      markup = `<div class="calendar">\n  <h3>${calendar.year}</h3>\n`;

      for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'days')) { 
        const entry = calendar.entries.find(entry => {
          return moment(entry.date, 'MMMM D[,] YYYY').isSame(date);
        });

        if (entry) {
          day = entry
          markup += `  <div class="days ${day.activity.text().trim().toLowerCase()}">Y\n`;
        } else {
          markup += `  <div class="days ${startDate.isAfter(moment()) ? "empty" : day.activity.text().trim().toLowerCase() }">N\n`;
        }

        markup += `    <div class="tooltip">\n`
        markup += `      <h3>${moment(date).format('MMMM D[,] YYYY')}</h3>\n`
        markup += `      <li>\n`
        markup += `        ${day.activity.html().trim()}\n`
        markup += `        <ul>\n`
        markup += `          <li>\n`
        markup += `            ${day.description.html().trim()}\n`
        markup += `          </li>\n`
        markup += `        </ul>\n`
        markup += `      </li>\n`
        markup += `    </div>\n`
        markup += "  </div>\n"
      }

      markup += '</div>\n\n';

      htmlMarkups.push(markup)
    }

    resultHTML = `\n${cssMarkup}\n\n${htmlMarkups.reverse().join('')}${jsMarkup}\n`

    // update target file
    const $output = cheerio.load(fs.readFileSync(targetFilePath, 'utf8'));
    
    $output('#calendar').html(resultHTML)

    fs.writeFileSync(targetFilePath, $output.html(), 'utf8');    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// cli
let inputFilePath;
let targetFilePath;

if (process.env.GITHUB_ACTIONS) {
  inputFilePath = path.resolve(process.env.INPUT_FILE);
  targetFilePath = path.resolve(process.env.TARGET_FILE);
} else {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: obsession-calendar <input-file> <output-file>');
    process.exit(1);
  }
  
  inputFilePath = path.resolve(args[0]);
  targetFilePath = path.resolve(args[1]);
}

if (!inputFilePath || !targetFilePath) {
  console.error('Both input file path and target file path are required.');
  process.exit(1);
}

run(inputFilePath, targetFilePath);