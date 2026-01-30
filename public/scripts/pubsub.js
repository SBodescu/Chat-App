export class PubSub {
    subscriptions = new Map();

    subscribe(name, fn) {
        const events = this.subscriptions.get(name);
        if (!events) {
            this.subscriptions.set(name, [fn]);
            return false;
        }
        events.push(fn);
    }

    publish(name, data) {
        const events = this.subscriptions.get(name);
        if(!events) {
            return false;
        }
        events.forEach(event => event.call(null, data));
    }
}