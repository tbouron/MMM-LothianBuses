Module.register('MMM-LothianBuses', {
    // Default module config.
    defaults: {
        interval: 30,
        animationSpeed: 1000,
        apiKey: null,
        busStopIds: []
    },

    apiHost: 'https://tfe-opendata.com/api/v1',

    buses: [],
    isLoaded: false,
    isUpdated: false,

    start: function() {
        var self = this;
        setTimeout(function() {
            self.update();
        }, this.config.interval * 1000);
        self.update();
    },

    getScripts: function () {
        return ['moment.js'];
    },

    getStyles: function () {
        return ['MMM-LothianBuses.css'];
    },

    update: function() {
        if (!this.config.apiKey) {
            return;
        }

        Promise.all(this.config.busStopIds.map(busStopId => {
            return fetch(`${this.apiHost}/live_bus_times/${busStopId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.config.apiKey}`
                }
            }).then(response => response.json());
        })).then(jsons => {
            this.buses = [];
            jsons.forEach(json => {
                if (json === null) {
                    return;
                }
                json.forEach(bus => {
                    this.buses.push(bus);
                });
            });
            this.buses.sort((a, b) => a.routeName - b.routeName);
            this.isUpdated = false;
            if (!this.isLoaded) {
                this.isLoaded = true;
            }
        }).catch(error => {
            Log.error("Failed to update data: ", error);
            this.isUpdated = false;
        }).finally(() => {
            this.updateDom(this.config.animationSpeed);
        });
    },

    getDom: function() {
        var wrapper = document.createElement('div');
        wrapper.className = 'lothian-buses';

        if (!this.config.apiKey) {
            wrapper.className = 'thin small dimmed';
            wrapper.innerHTML = this.translate('Module not configured. Please specify an API key');
            return wrapper;
        }
        if (!this.config.busStopIds.length === 0) {
            wrapper.className = 'thin small dimmed';
            wrapper.innerHTML = this.translate('Module not configured. Please specify at least one bus stop');
            return wrapper;
        }
        if (!this.isLoaded) {
            wrapper.className = 'light small dimmed';
            wrapper.innerHTML = this.translate('Loading live timetable');
            return wrapper;
        }
        if (this.buses.length === 0) {
            wrapper.className = 'light small dimmed';
            wrapper.innerHTML = this.translate('No buses');
            return wrapper;
        }

        this.buses.forEach(bus => {
            var number = bus.routeName;
            var departures = Array.from(bus.departures);

            var row = document.createElement('div');
            row.className = 'bus';

            // Bus number
            var busNumber = document.createElement('div');
            busNumber.className = 'bus-number';
            busNumber.innerHTML = `<span class="number thin medium">${number}</span>`;
            row.appendChild(busNumber);

            if (departures && departures.length > 0) {
                // Destination
                var destination = document.createElement('span');
                destination.className = 'light small dimmed';
                destination.innerText = departures[0].destination;
                busNumber.appendChild(destination);

                // Bus times
                var busTimes = document.createElement('div');
                busTimes.className = 'bus-times medium thin';
                var busTimeMain = document.createElement('div');
                busTimeMain.className = `bus-time-main ${departures[0].isLive ? 'bright' : 'dimmed'}`;
                busTimeMain.innerHTML = `<span><strong>${moment(departures[0].departureTimeUnix * 1000).diff(new Date(), 'minutes')}${!departures[0].isLive ? '<sup>*</sup>' : ''}</strong></span> <span>${this.translate('mins')}</span>`;
                busTimes.append(busTimeMain);

                departures.shift();
                var busTimeNext = document.createElement('div');
                busTimeNext.className = 'bus-time-next small';
                if (departures.length > 0) {
                    busTimeNext.innerHTML = `${this.translate('then in')} ${departures.map(departure => `<strong>${moment(departure.departureTimeUnix * 1000).diff(new Date(), 'minutes')}${!departures.isLive ? '<sup>*</sup>' : ''}</strong>`).join(', ')} ${this.translate('mins')}`;
                } else {
                    busTimeNext.innerHTML = this.translate('not available');
                }
                busTimes.appendChild(busTimeNext);
                row.appendChild(busTimes);
            }

            wrapper.appendChild(row);
        });

        return wrapper;
    }
});