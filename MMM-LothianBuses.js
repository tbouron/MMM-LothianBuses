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

    isError: false,
    hasWarnings: false,

    start: function() {
        const self = this;
        self.update();
        setInterval(function() {
            self.update();
        }, this.config.interval * 1000);
    },

    getScripts: function () {
        return ['moment.js'];
    },

    getStyles: function () {
        return [
            'font-awesome.css',
            'MMM-LothianBuses.css'
        ];
    },

    update: function() {
        if (!this.config.apiKey) {
            return;
        }

        Promise.all(this.config.busStopIds.map(busStopItem => {
            let busStopId = busStopItem;
            let includeLines = null;
            if (busStopItem instanceof Array) {
                busStopId = busStopItem[0];
                includeLines = busStopItem.slice(1);
            }
            return fetch(`${this.apiHost}/live_bus_times/${busStopId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.config.apiKey}`
                }
            }).then(response => {
                return includeLines instanceof Array
                    ? response.json().then(json => json.filter(bus => includeLines.includes(bus.routeName)))
                    : response.json();
            });
        })).then(jsons => {
            const newBuses = [];
            let hasWarnings = false;
            jsons.forEach(json => {
                if (json === null) {
                    hasWarnings = hasWarnings || true;
                    return;
                }
                json.forEach(bus => {
                    newBuses.push(bus);
                });
            });

            this.hasWarnings = hasWarnings;

            newBuses.sort((a, b) => {
                const d = a.departures[0].departureTimeUnix - b.departures[0].departureTimeUnix;
                if (d !== 0) {
                    return d;
                }
                const n = a.routeName - b.routeName;
                if (n !== 0) {
                    return n;
                }
                return a.departures[0].destination - b.departures[0].destination;
            });
            const animate = this.buses.length !== newBuses.length;
            this.buses = newBuses;
            this.isError = false;
            this.updateDom(animate ? this.config.animationSpeed : undefined);
        }).catch(error => {
            Log.error("Failed to update data: ", error);
            this.buses = [];
            this.isError = true;
            this.hasWarnings = true;
            this.updateDom(this.config.animationSpeed);
        });
    },

    getDom: function() {
        const wrapper = document.createElement('div');
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
        if (this.isError) {
            wrapper.className = 'light small dimmed';
            wrapper.innerHTML = this.translate('Data unavailable. Please check logs.');
            return wrapper;
        }
        if (this.buses.length === 0) {
            wrapper.className = 'light small dimmed';
            wrapper.innerHTML = this.translate('No buses');
            return wrapper;
        }

        if (this.hasWarnings) {
            wrapper.innerHTML += `<div class="light xsmall dimmed"><i class="fas fa-exclamation-triangle"></i> <em>${this.translate('Some of the routes are not available.')}</em></div>`;
        }

        this.buses.forEach(bus => {
            const number = bus.routeName;
            const departures = Array.from(bus.departures);

            const row = document.createElement('div');
            row.className = 'bus';

            // Bus number
            const busNumber = document.createElement('div');
            busNumber.className = 'bus-number';
            busNumber.innerHTML = `<span class="number light medium">${number}</span>`;
            row.appendChild(busNumber);

            if (departures && departures.length > 0) {
                // Destination
                const destination = document.createElement('span');
                destination.className = 'light xsmall light';
                destination.innerText = departures[0].destination;
                busNumber.appendChild(destination);

                // Bus times
                const nextTime = moment(departures[0].departureTimeUnix * 1000).diff(new Date(), 'minutes');
                const busTimes = document.createElement('div');
                busTimes.className = 'bus-times';
                const busTimeMain = document.createElement('div');
                busTimeMain.className = `bus-time-main medium thin ${departures[0].isLive ? 'bright' : 'dimmed'}`;
                const innerHTML = [
                    `<span><strong>${nextTime > 1 ? nextTime : this.translate('Due')}${!departures[0].isLive ? '<sup>*</sup>' : ''}</strong></span>`,
                ];
                if (nextTime > 1) {
                    innerHTML.push(`<span>${this.translate('mins')}</span>`);
                }
                busTimeMain.innerHTML = innerHTML.join(' ');
                busTimes.append(busTimeMain);

                departures.shift();
                const busTimeNext = document.createElement('div');
                busTimeNext.className = 'bus-time-next xsmall light';
                if (departures.length > 0) {
                    busTimeNext.innerHTML = `${this.translate('then in')} ${departures.map(departure => `<strong>${moment(departure.departureTimeUnix * 1000).diff(new Date(), 'minutes')}</strong>`).join(', ')} ${this.translate('mins')}`;
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