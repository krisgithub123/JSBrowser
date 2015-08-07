﻿browser.on("init", function () {
    "use strict";

    const URI = Windows.Foundation.Uri;

    // Listen for the navigation start
    this.webview.addEventListener("MSWebViewNavigationStarting", e => {
        this.loading = true;

        // Update the address bar
        this.currentUrl = e.uri;
        this.updateAddressBar(this.currentUrl);

        console.log(`Navigating to ${this.currentUrl}`);

        this.hideFavicon();
        this.showProgressRing(true);

        // Show the stop button
        this.showStop();

        // Create the C++ Windows Runtime Component
        var winRTObject = new NativeListener.KeyHandler();

        // Add a native WinRT object as a global parameter
        this.webview.addWebAllowedObject("NotifyApp", winRTObject);

        // Listen for an app notification from the WinRT object
        winRTObject.onnotifyappevent = e => this.handleShortcuts(e.target);
    });

    // Listen for the DOM content to have completely loaded
    this.webview.addEventListener("MSWebViewDOMContentLoaded", () => {
        // Listen keyboard shortcuts within the WebView
        let asyncOp = this.webview.invokeScriptAsync("eval", this.shortcutScript(true));
        asyncOp.onerror = e => console.error(`Unable to listen for keyboard shortcuts: ${e.message}`);
        asyncOp.start();
    });

    // Listen for the navigation completion
    this.webview.addEventListener("MSWebViewNavigationCompleted", e => {
        this.loading = false;
        this.showProgressRing(false);
        this.getFavicon(e.uri);

        // Update the page title
        this.documentTitle = this.webview.documentTitle;

        // Show the refresh button
        this.showRefresh();

        // Update the navigation state
        this.updateNavState();
    });

    // Listen for unviewable content
    this.webview.addEventListener("MSWebViewUnviewableContentIdentified", e => {
        console.error(`Unviewable content: ${e.message}`);
        if (e.mediaType === "application/pdf") {
            Windows.System.Launcher.launchURIAsync(new URI(e.uri));
        }
    });

    // Listen for an unsupported URI scheme
    this.webview.addEventListener("MSWebViewUnsupportedURISchemeIdentified",
        e => console.error(`Unsupported URI scheme: ${e.message}`));

    // Listen for a new window
    this.webview.addEventListener("MSWebViewNewWindowRequested", e => {
        console.log("New window requested");
        e.preventDefault();
        window.open(e.uri);
    });

    // Listen for a permission request
    this.webview.addEventListener("MSWebViewPermissionRequested", e => {
        console.log("Permission requested");
        if (e.permissionRequest.type === "geolocation") {
            e.permissionRequest.allow();
        }
    }); 
 });
