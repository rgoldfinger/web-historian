var path = require('path');
var fs = require('fs');
var archive = require('../helpers/archive-helpers');
var Q = require('q');


exports.headers = headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10, // Seconds.
  'Content-Type': "text/html"
};

var mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css'
};

exports.serveAssets = function(res, asset) {
  //check if file exists
  var assetUrl = asset.split('').slice(1).join('');

  console.log(assetUrl, 'Archived?')
  archive.isURLArchived(assetUrl).then(function (archived) {
    if (archived) {
      console.log('IT is archived and we will attempt to serve it');
      //serve archived web site
      headers['Content-Type'] = mimeTypes['.html'];
      res.writeHead(200, headers);
      archive.getHTML(assetUrl).then(function (html) {
        res.end(html);
      });
    } else {
      console.log('not archived')
      asset = path.join(__dirname, '/public', asset);
      fs.exists(asset, function (exists) {
        console.log('Exists?')
        if (exists) {
          console.log('Exists!!!')
          headers['Content-Type'] = mimeTypes[asset.split('.').reverse()[0]];
          res.writeHead(200, headers);
          var readStream = fs.createReadStream(asset);
          readStream.pipe(res);
        } else {
          exports.handle404(null, res);
        }
      });
    }
  });

};

exports.acceptPost = function(req, res) {
  var data = '';
  req.on('data', function(chunk){
    data += chunk;
  });
  req.on('end', function(){
    var url = data.slice(4);
    console.log("post ", url, ", is it archived?");
    archive.isURLArchived(url).then(function (archived) {
      if (archived) {
        console.log(url, " is archived");
        res.setHeader('location', 'http://127.0.0.1:8080/' + url);
        res.writeHead(302, headers);
        res.end();
      } else {
        console.log(url, " is not archived");

        archive.addUrlToList(url);
        exports.serveAssets(res, 'loading.html');
      }
    });
  });
};

exports.handle404 = function(req, res) {
  headers['Content-Type'] = 'text/plain';
  res.writeHead(404, headers);
  res.end('404 - File not found');
};



//accept posts
  //get form data (url? something else?)
  //check if archived =>
    // yes: call serve assets
    // else:
      // serve loading (serve assets)
      // call archive helpers add url to list

// As you progress, keep thinking about what helper functions you can put here!
