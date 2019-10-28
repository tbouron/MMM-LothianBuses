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
            const newBuses = [];
            jsons.forEach(json => {
                if (json === null) {
                    return;
                }
                json.forEach(bus => {
                    newBuses.push(bus);
                });
            });
            newBuses.sort((a, b) => a.routeName - b.routeName);
            const animate = this.buses.length !== newBuses.length;
            this.buses = newBuses;
            this.isUpdated = true;
            if (!this.isLoaded) {
                this.isLoaded = true;
            }
            this.updateDom(animate ? this.config.animationSpeed : undefined);
        }).catch(error => {
            Log.error("Failed to update data: ", error);
            this.isUpdated = false;
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
            const number = bus.routeName;
            const departures = Array.from(bus.departures);

            const row = document.createElement('div');
            row.className = 'bus';

            // Bus number
            const busNumber = document.createElement('div');
            busNumber.className = 'bus-number';
            busNumber.innerHTML = `<span class="number thin medium">${number}</span>`;
            row.appendChild(busNumber);

            if (departures && departures.length > 0) {
                // Destination
                const destination = document.createElement('span');
                destination.className = 'light small dimmed';
                destination.innerText = departures[0].destination;
                busNumber.appendChild(destination);

                // Bus times
                const nextTime = moment(departures[0].departureTimeUnix * 1000).diff(new Date(), 'minutes');
                const busTimes = document.createElement('div');
                busTimes.className = 'bus-times medium thin';
                const busTimeMain = document.createElement('div');
                busTimeMain.className = `bus-time-main ${departures[0].isLive ? 'bright' : 'dimmed'}`;
                const innerHTML = [
                    `<span><strong>${nextTime > 0 ? nextTime : this.translate('Due')}${!departures[0].isLive ? '<sup>*</sup>' : ''}</strong></span>`,
                ];
                if (nextTime > 0) {
                    innerHTML.push(`<span>${this.translate('mins')}</span>`);
                }
                busTimeMain.innerHTML = innerHTML.join(' ');
                busTimes.append(busTimeMain);

                departures.shift();
                const busTimeNext = document.createElement('div');
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