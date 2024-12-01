# google-alerts-creator.md

SRC: https://dev.to/mailmeteor/how-to-create-a-bunch-of-google-alerts-in-3-minutes-54n 

This make-shift script allows you to create a bunch of Google Alerts at the same time. This is accomplished by going to the 
actual google alerts interface and listening to a "/create" request in the network tab in order to form the params
for a fetch that contain special tokens that allow us to use the API directly from the browser.

- not sure how long an existing "fetch template" is valid for
    - last refresh: 04/21/24
- could break at any time API changes

## todo
- add timer between api calls? can't tell if it's just really slow or if I'm getting rate-limited or something like that

## bugs

- I get `https://play.google.com/log` errors reported back in console, but they don't seem to affect functionality
