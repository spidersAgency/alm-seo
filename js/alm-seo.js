/*
 * Ajax Load More - SEO
 * https://connekthq.com/plugins/ajax-load-more/add-ons/search-engine-optimization/
 *
 * Copyright Connekt Media - https://connekthq.com
 *
 * Author: Darren Cooney
 * Twitter: @KaptonKaos
*/

var almSEO = {};

jQuery(document).ready(function ($) {

   if (typeof window.history.pushState == 'function') { // Wrap function in a browser support function



      /*
       * Initial Vars
       *
       */
      almSEO.init = true;
      almSEO.paging = false;
      almSEO.previousUrl = window.location.href;
      almSEO.isAnimating = false;
      almSEO.defaultPage = 1;
      almSEO.fromPopstate = false;



      /*
       * $.fn.almSEO
       * Function is triggered from core ajax-load-more.js file.
       *
       * @param alm   object
       * @param preloadedInit   boolean
       */
      $.fn.almSEO = function(alm, preloadedInit){

         if (alm.seo_scroll === undefined) {
            alm.seo_scroll = 'true';
         }

         almSEO.canonical_url = alm.canonical_url;
         almSEO.slug = alm.slug;
         almSEO.speed = 1000;
         almSEO.permalink = alm.permalink; // Get permalink type
         almSEO.pageview = alm.pageview; // Send Google Analytics pageviews
         almSEO.postsPerPage = alm.posts_per_page; // Get posts_per_page value
         almSEO.preloaded = (alm.preloaded === 'true') ? true : false; // Get preload value
         almSEO.scroll = (alm.seo_scroll === 'true') ? true : false;  // Scrolling enabled
         almSEO.speed = alm.seo_scroll_speed;  // Scroll speed value
         almSEO.scrolltop = alm.seo_scrolltop; // Scrolltop
         almSEO.controls = alm.seo_controls; // Enable back/fwd button controls
         almSEO.controls = (almSEO.controls === '1') ? true : false;
         almSEO.newPath = ''; // New URL
         almSEO.paging = alm.paging;
         almSEO.content = alm.content; // Current ALM div
         almSEO.trailingslash = (almSEO.content.attr('data-seo-trailing-slash') === 'false') ? '' : '/' ; // Add trailing slash to URL
         almSEO.first = $('.alm-seo').eq(0);

         if (alm.is_search === undefined){
            alm.is_search = false;
         }
         // Convert to value of slug for appending to seo url
         almSEO.search_value = (alm.is_search === 'true') ? almSEO.slug : '';

         var page = alm.page + 1,
             nextpage = (almSEO.preloaded) ? alm.page + 3 : alm.page + 2,
             start = (almSEO.preloaded) ? 0 : 1; // If preloaded, then start on page 0

         if(preloadedInit){
            nextpage = alm.page + 2;
         }

         // Get URLs for current and the next page
         almSEO.newPath = $.fn.almSEOGetURL(page, start, almSEO.permalink); // current page
         almSEO.nextPath = $.fn.almSEOGetURL(nextpage, start, almSEO.permalink); // Upcoming page

         // Set alm.button href to next URL
         if(!almSEO.paging){
            // Set delay to wait for core ALM to catch up
            setTimeout(function(){
               if(alm.button.hasClass('done')){
                  alm.button.attr('href', 'javascript:void(0);');
               } else {
                  alm.button.attr('href', almSEO.nextPath);
               }
            }, 200);
         }

         if(preloadedInit) return false;


         // Slide screen to current page
         // Do not scroll if paging add-on is enabled or page == 0
         if(page >= 1 && !almSEO.paging){
            if(almSEO.scroll || almSEO.init){
	            if(almSEO.preloaded){ // Preloaded
		            // If start_page > 0, move user to page
		            if(almSEO.init && alm.start_page > 0){
			            almSEO.scrollToPage(page + 1);
		            } else {
			            if(almSEO.scroll){
			            	almSEO.scrollToPage(page + 1);
			            }
		            }
	            } else {
		            // Standard
		            if(page > 1){
		            	almSEO.scrollToPage(page);
		            }
	            }
            }
         }

         // If paging & first run. Set defaultPage var
         if(almSEO.paging && almSEO.init){
	         almSEO.defaultPage = page;
	         if(almSEO.preloaded){
		         // If preloaded, add 1 page to defaultPage
		         almSEO.defaultPage = parseInt(alm.content.attr('data-seo-start-page')) + 1;
	         }
         }

         // Set URL for Paging add-on
         if(almSEO.paging){
            if(!almSEO.fromPopstate){
               almSEO.setURL(page, almSEO.newPath);
            }else{
               almSEO.fromPopstate = false;
            }
         }

         almSEO.init = false; // Reset almSEO.init
      }



      /*
       * almSEOGetURL
       * Get the current page URL
       *
       * @param page   int
       * @param start   int
       * @param permalink   string
       *
       * @return new_url   string
       */
      $.fn.almSEOGetURL = function(page, start, permalink){

         var url = almSEO.cleanURL(window.location.toString()), // Full URL
             new_url; // Updated URL

         // Default Permalinks (http://example.com/?p=N)
         if(almSEO.permalink === 'default'){

            var querystring = window.location.search; // Get querysting value

            if(querystring !== '' && page > start){
               // Does URL have a 'paged' value?
               if(!almSEO.getQueryVariable('paged')){ // No $paged value
                  new_url = url + '&paged=' + page;
               }else{ // Has $paged value, let's replace it
                  new_url = url.replace(/(paged=)[^\&]+/, '$1' + page);
               }
            }else{ // Empty querystring
               if(page > 1){
                  new_url = url + '?paged=' + page;
               }else{
                  new_url = url;
               }
            }

         }

         // Pretty Permalinks( http://example.com/2016/post-name/)
         else {

            var urlPieces = url.split('/'), // Split URL into array
                currPageNumber = urlPieces[urlPieces.length-2]; // Get value

   	      if(page === 1){
      	      new_url = almSEO.canonical_url + almSEO.search_value;
   	      }else{
               new_url = almSEO.canonical_url + 'page/' + page + almSEO.trailingslash + almSEO.search_value;
   	      }

         }

         // Return the updated URL
         return new_url;
      }



      /*
       * SEO Scroll events
       * On scroll, update the browser URL
       * @return null
       */

      var almSEOTimer;
      $(window).bind('scroll touchstart', function(){

         if(!almSEO.isAnimating && !almSEO.paging && !almSEO.init){

            if(almSEOTimer) {
               window.clearTimeout(almSEOTimer);
            }

		      almSEOTimer = window.setTimeout(function() {

		         // Get container scroll position
		         var fromTop = parseInt(Math.round($(this).scrollTop())) + parseInt(almSEO.scrolltop),
		             posts = $('.alm-seo'),
		             url = window.location.href;

		         var cur = posts.map(function(){
		            if ($(this).offset().top < fromTop)
		               return this;
		         });


		         // Get the data attributes of the current element
		         cur = cur[cur.length-1];
		         var page = $(cur).data('page'),
		             permalink = $(cur).data('url');

		         // If is first page
		         if(page === undefined){
		            page = almSEO.first.data('page');
		            permalink = almSEO.first.data('url');
		         }

		         if(url !== permalink){
				      almSEO.setURL(page, permalink);
		         }

	         }, 25);

	      }

      });



      /*
         almSEO.setURL()
         Set the browser URL to current permalink then scroll user to post

         @param page     int
         @param permalink     string
      */
      almSEO.setURL = function(page, permalink){

         var state = {
            page: page,
            permalink: permalink
         };

         if(permalink !== almSEO.previousUrl && !almSEO.fromPopstate){
				
				// If pushstate is enabled
				if(almSEO.controls){
            	history.pushState(state, window.location.title, permalink);
            } else{
	            history.replaceState(state, window.location.title, permalink);
            }

            // Callback Function (URL Change)
            if ($.isFunction($.fn.almUrlUpdate)) {
               $.fn.almUrlUpdate(permalink, 'seo');
            }

            // Google Analytics - send pageview
            if(almSEO.pageview === 'true'){ // Send pageviews to Google Analytics

            	var location = window.location.href,
         	    	 path = '/'+window.location.pathname;

         	   // Gtag GA Tracking
            	if (typeof gtag !== 'undefined' && $.isFunction(gtag)) {
   				   gtag('event', 'page_view', { 'page_path': path });
   				}
   				
         	   // Deprecated GA Tracking
            	if (typeof ga !== 'undefined' && $.isFunction(ga)) {
   				   ga('send', 'pageview', path);
   				}
   				
   				// Monster Insights
   				if (typeof __gaTracker !== 'undefined' && $.isFunction(__gaTracker)) { // Check that func exists
   				   __gaTracker('send', 'pageview', path);
   				}

   			}
   			almSEO.previousUrl = permalink;

			}
			almSEO.fromPopstate = false;

      }



      /*
         popstate
         Fires when user click back or fwd btn

         @return null
      */
      window.addEventListener('popstate', function(event) {

			// Wrap function is a data attr check
			// - if wrapper doesnt have data-seo="true" don't fire popstate

			var almListing = document.querySelector('.alm-listing.alm-ajax');

			if(almListing.dataset.seo === 'true'){

	         if(!almSEO.paging){

	            almSEO.getPageState(event.state);

	         }else{

	            // Paging
	            if($.isFunction($.fn.almSetCurrentPage) && $.isFunction($.fn.almGetObj)){

	               var current = event.state,
	               	 almBtnWrap = $.fn.almGetParentContainer(),
	                   almObj = $.fn.almGetObj();

	               if(current === null){ // check from null state value
		            	current = almSEO.defaultPage;
		            } else {
			            current = event.state.page;
	               }

	               almSEO.fromPopstate = true; // Set almSEO.fromPopstate flag to true - so we don't trigger pushstate on url update

	               $.fn.almSetCurrentPage(current, almBtnWrap, almObj);

	            }
	         }

         }
      });



      /*
       * almSEO.getPageState()
       * Get the current page number
       *
       * @return null
      */

      almSEO.getPageState = function(data){

	      var page;
	      if(data === null){ // Will be null with preloaded, so set -1
		      page = -1;
	      }else{
		      page = data.page;
	      }

	      if($('#ajax-load-more .alm-listing[data-seo=true]').length){
		      almSEO.scrollToPage(page);
   	      //if(almSEO.scroll){
               //almSEO.scrollToPage(page);
            //}
         }

      }



      /*
       * almSEO.getCurrentPageTop()
       * Get the offset().top of the current page
       *
       * @return null
       * @deprecated v1.5
      */

      almSEO.getCurrentPageTop = function(page){
         if(almSEO.scroll) {
            almSEO.scrollToPage(page);
         }
      }



      /*
       * almSEO.scrollToPage()
       * Scroll page to element using jQuery .animate()
       *
       * @return null
      */

      almSEO.scrollToPage = function(page){

         if(page === undefined || page === 'undefined' || page === '-1' || page === -1){
            page = $('.alm-seo').eq(0).data('page');
         }
         if(!almSEO.isAnimating){
            almSEO.isAnimating = true;
            var top = Math.round($('.alm-seo[data-page="'+page+'"]').offset().top - almSEO.scrolltop + 5);
            $('html, body').delay(150).animate({ scrollTop: top + 'px' }, almSEO.speed, 'almSEO_easeInOutQuad', function(){
               almSEO.isAnimating = false;
            });
         }

      }



      /*
       * almSEO.cleanURL()
       * Removes hash from url
       *
       * @return path
      */

      almSEO.cleanURL = function(path){
         var loc = path,
             index = loc.indexOf('#');

         if (index > 0) {
           path = loc.substring(0, index);
         }
         return path;
      }



      /*
       * almSEO.getQueryVariable()
       * Get querysting value
       *
       * @return true|false
      */

      almSEO.getQueryVariable = function(variable) {
   		var query = window.location.search.substring(1);
   		var vars = query.split('&');
   		for (var i = 0; i < vars.length; i++) {
   			var pair = vars[i].split('=');
   			if (decodeURIComponent(pair[0]) == variable) {
   				return decodeURIComponent(pair[1]);
   			}
   		}
   		return false;
   	}



      /*
       * almSEO_easeInOutQuad()
       * Custom easing function
       *
       * @return easing
      */

      $.easing.almSEO_easeInOutQuad = function (x, t, b, c, d) {
         if ((t /= d / 2) < 1) return c / 2 * t * t + b;
         return -c / 2 * ((--t) * (t - 2) - 1) + b;
      };

   }

});
