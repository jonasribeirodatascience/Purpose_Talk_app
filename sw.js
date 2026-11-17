/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "5904b69be43e21934d4fed5cbf55fc2e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "701cf830a882039561673ee0af06482e"
  }, {
    "url": "pwa-192x192.png",
    "revision": "2bab1f00a9caaa5b1ed2ad04b584b5d7"
  }, {
    "url": "og-cover.jpg",
    "revision": "8ab08b45f71cd7b9f32099ad387daa59"
  }, {
    "url": "manifest.webmanifest",
    "revision": "8b11cb9b73f857280600ecf970e5ccff"
  }, {
    "url": "index.html",
    "revision": "144b5e42cf6cd6110a8b22c18881f3c6"
  }, {
    "url": "icon.svg",
    "revision": "02686d5ce11e7cc9f581daf100ff7afa"
  }, {
    "url": "firebase-messaging-sw.js",
    "revision": "55f79626d298c21023eda535a7fa0391"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "33ae433c7ac354f9c16cc8f7c1c9023c"
  }, {
    "url": "assets/index-Di-nf2UM.css",
    "revision": null
  }, {
    "url": "assets/index-BizIy7qf.js",
    "revision": null
  }, {
    "url": "assets/hero_landing_worship_tech_1794927449132-Co47uSr6.jpg",
    "revision": null
  }, {
    "url": "assets/avatar_sarah_tech_1794342059001-D5v5qRob.jpg",
    "revision": null
  }, {
    "url": "assets/avatar_pastor_david_1794342044512-Bnmm9VTN.jpg",
    "revision": null
  }, {
    "url": "assets/avatar_jake_buddy_1794342076570-C3BTyOtw.jpg",
    "revision": null
  }, {
    "url": "assets/avatar_emma_british_1794342088937-C0y4NZLY.jpg",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "33ae433c7ac354f9c16cc8f7c1c9023c"
  }, {
    "url": "icon.svg",
    "revision": "02686d5ce11e7cc9f581daf100ff7afa"
  }, {
    "url": "pwa-192x192.png",
    "revision": "2bab1f00a9caaa5b1ed2ad04b584b5d7"
  }, {
    "url": "pwa-512x512.png",
    "revision": "701cf830a882039561673ee0af06482e"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "5904b69be43e21934d4fed5cbf55fc2e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "8b11cb9b73f857280600ecf970e5ccff"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/firebase-messaging-sw\.js$/, /^\/\.well-known\//]
  }));

}));
