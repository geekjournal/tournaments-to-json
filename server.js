var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio'), cheerioTableparser = require('cheerio-tableparser');
var app     = express();

// This is the spreadsheet that contains the Tournament data we want.
// https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586

// This is how you have to query that spreadsheet to actually get the data
// curl 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586' -H 'authority: docs.google.com' -H 'cache-control: max-age=0' -H 'upgrade-insecure-requests: 1' -H 'dnt: 1' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'x-client-data: CIq2yQEIo7bJAQjBtskBCKmdygEIqKPKAQ==' -H 'x-chrome-connected: id=117602618126914006031,mode=0,enable_account_consistency=false' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'cookie: S=apps-spreadsheets=QC7KTnSKjWJ9n3dNktzjyaQGM0AYoeqe; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3; OGPC=19005936-1:19006326-1:19006818-1:19006965-1:19007018-1:; OGP=-19005936:-19006965:-19007018:; SID=MQac4__zVRJQCaE01W3bTqkDoxq4QVNIycc2W2NtnO-mO9dM8OX0smfk3nQlz_9zDMY16A.; HSID=A03BY5GeUi7Zac1PY; SSID=A3X-dLXTIUa2rByrK; APISID=p8obGQVNd2kf5JL1/AJkRZO-gAKnNDbUJM; SAPISID=0NdIcLt9qhb18m7l/ATLPtHqMxFBDGm2dN; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3:explorer=AMbLQ14eRLykVAU5vEK2qeLp0cgo7ECC; NID=134=rG82b7SoaRalxIPiDEoGZnGJyH78XXfwIYoD17yCPZ9PdRcZoJam4EEFjf3JA7V02wgPBaVm-TLWrhFDExF8KwiOzSfP_5lfwTuFL__UWAknVdDqyFeT-JH6EWh5SQEZtHZR5efdwzs9DrtjWMFp_nPooslM6YzoEXcjHi1gRpUiL5BmqhLcUXcsab988HeerCvIZR_F_a6rvnBwp_xBtyzVLu1n9sZA5nPLU6o-vtOxb4bvZkbEN86r7EPq9pDqe2lDNYm3T_x_b_MIqppkxpilXGDpijIgDk5vtLhROzVkgnICnGi3FYO7SQ; 1P_JAR=2018-07-09-02; SIDCC=AEfoLeY40XTBMJfssVYYWXr3D_JMZBSlY8snLsUWPwuBlYbjC4USYW3VK0qpNSkd2dUMFcU77Jcg' --compressed

app.get('/', function(req, res){
    res.send('nothing to see here')
})

app.get('/scrape', function(req, res){
    //All the web scraping magic will happen here
    console.log('scrape called')
    //url = 'http://www.imdb.com/title/tt1229340/';
    // url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586'

    // Let's grab the tournament data with a curl
    var c = require('child_process');
    var html = c.execSync(`curl 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHVjDZcS0SRqJXYp4CaTHlC5EkJnVLGYnsVma3roFCBHo9SNQvqW5WyMF5UFJwPGltnh3x96yGnljb/pubhtml/sheet?headers%5Cx3dfalse&gid=2091685586' -H 'authority: docs.google.com' -H 'cache-control: max-age=0' -H 'upgrade-insecure-requests: 1' -H 'dnt: 1' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'x-client-data: CIq2yQEIo7bJAQjBtskBCKmdygEIqKPKAQ==' -H 'x-chrome-connected: id=117602618126914006031,mode=0,enable_account_consistency=false' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'cookie: S=apps-spreadsheets=QC7KTnSKjWJ9n3dNktzjyaQGM0AYoeqe; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3; OGPC=19005936-1:19006326-1:19006818-1:19006965-1:19007018-1:; OGP=-19005936:-19006965:-19007018:; SID=MQac4__zVRJQCaE01W3bTqkDoxq4QVNIycc2W2NtnO-mO9dM8OX0smfk3nQlz_9zDMY16A.; HSID=A03BY5GeUi7Zac1PY; SSID=A3X-dLXTIUa2rByrK; APISID=p8obGQVNd2kf5JL1/AJkRZO-gAKnNDbUJM; SAPISID=0NdIcLt9qhb18m7l/ATLPtHqMxFBDGm2dN; S=billing-ui-v3=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:billing-ui-v3-efe=ew_5CuqcWsTmfvZ1ss-t-2wN5eALw-V7:grandcentral=OFGJmXD_0MddVUiLDMD54rGH3orKOjk3:explorer=AMbLQ14eRLykVAU5vEK2qeLp0cgo7ECC; NID=134=rG82b7SoaRalxIPiDEoGZnGJyH78XXfwIYoD17yCPZ9PdRcZoJam4EEFjf3JA7V02wgPBaVm-TLWrhFDExF8KwiOzSfP_5lfwTuFL__UWAknVdDqyFeT-JH6EWh5SQEZtHZR5efdwzs9DrtjWMFp_nPooslM6YzoEXcjHi1gRpUiL5BmqhLcUXcsab988HeerCvIZR_F_a6rvnBwp_xBtyzVLu1n9sZA5nPLU6o-vtOxb4bvZkbEN86r7EPq9pDqe2lDNYm3T_x_b_MIqppkxpilXGDpijIgDk5vtLhROzVkgnICnGi3FYO7SQ; 1P_JAR=2018-07-09-02; SIDCC=AEfoLeY40XTBMJfssVYYWXr3D_JMZBSlY8snLsUWPwuBlYbjC4USYW3VK0qpNSkd2dUMFcU77Jcg' --compressed`).toString(); //returns stdout

    var $ = cheerio.load(html);
    cheerioTableparser($);

    tableData = $("table").parsetable(true, true, true);
    flippedTableData = tableData[0].map((col, i) => tableData.map(row => row[i]));

    var obj = { date : "", name : "", city : "", ID : ""};
    var json = [];

    for(var i = 0; i < flippedTableData.length; i++) {
        if (i === 0) { continue; }
        if (i === 1) { continue; }
        var item = flippedTableData[i];

        obj.date = item[1];
        obj.name = item[2];
        obj.city = item[3];
        obj.ID = item[4];
        json.push(obj);
    }

    res.send(JSON.stringify(json, null, 4))

    // fs.writeFile('keith.json', JSON.stringify(json, null, 4), function(err){
    //     console.log('File successfully written! - Check your project directory for the output.json file');
    // })

    // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
    res.send('Check your console!')
    
})

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;