type Case = [string, (
    | ((container: HTMLElement) => Promise<unknown>)
)];

export const test = (cases: Case[]) => {
    let container: HTMLElement = null as any;

    beforeEach(() => {
      container = document.createElement('main');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
      container = null as any;
    });

    cases.forEach(([name, runner]) => {
        it(name, () => runner(container));
    });
};
