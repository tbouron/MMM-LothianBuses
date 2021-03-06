# MagicMirror Module: Lothian Buses

`MMM-LothianBuses` is a module for [MagicMirror](https://github.com/MichMich/MagicMirror) that allows you to display real time information about Lothian Buses bus stops.
The data is provided by [Transport for Edinburgh Open data](https://tfe-opendata.readme.io/) scheme.

![Screenshot of the Lothian Buses module](./screenshot.png)

## Usage

### Prerequisites

This module requires an API key to work. The key is free but you need to make [a request to get one here](http://www.mybustracker.co.uk/?page=API%20Key).

### Setup

Clone this module into your MagicMirror's `modules` directory

```shell script
cd modules
git clone https://github.com/tbouron/MMM-LothianBuses
```

then add the module to your MagicMirror's configuration. Here is an example:

```javascript
/* MagicMirror/config/config.js */
{
    /* ...your other config here */

    modules: [

        /* ...your other modules here */

        {
            module: 'MMM-LothianBuses',
            header: 'Buses',
            position: 'top_left',
            config: {
                apiKey: '<YOUR-API-KEY>',
                busStopIds: [
                    '<BUS-STOP-ID-#1>',
                    '<BUS-STOP-ID-#2>',
                    '<BUS-STOP-ID-#3>',
                    ['<BUS-STOP-ID-#4>', '<BUS-LINE-TO-INCLUDE>', '<ANOTHER-BUS-LINE-TO-INCLUDE>', ...]
                    ....
                ]
            }
        }
    ]
}
```

### Configuration options

| Configuration key | Description | Default | Required |
| --- | --- | --- | ---|
| apiKey | The API key for the transports of Edinburgh open data. You can [request one here](http://www.mybustracker.co.uk/?page=API%20Key). | `null` | Yes |
| busStopIds | The list of bus stop IDs to display. Each items can either be a string containing the bus stop ID, or an array where the first item is the bus stop ID, and the subsequent ones are line numbers that needs to be included. | `[]` | Yes |

### Finding bus stop IDs

Go to [Google maps](https://www.google.co.uk/maps) and click on the bus stop you are interested in. The information card will display the bus stop ID associated to it.
