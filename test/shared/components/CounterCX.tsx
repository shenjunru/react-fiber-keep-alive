import type { Logger } from '@shared/interfaces/Logger';
import * as React from 'react';
import { ForwardRef } from '@shared/components/ForwardRef';
import { lazy } from '@shared/helpers/lazy';
import { keepAlive, markClassComponentHasSideEffectRender } from '@shared/react-fiber-keep-alive';

type Props = {
    logger: Logger;
    prefix: string;
};

type State = {
    count: number;
};

export class CounterCX extends React.PureComponent<Props, State> {
    public static getDerivedStateFromProps(
        nextProps: Readonly<Props>,
        prevState: Readonly<State>,
    ) {
        nextProps.logger(`[${nextProps.prefix}] getDerivedStateFromProps()`, prevState.count);
        return null;
    }

    public state: State = { count: 0 };

    private setButtonRef = (value: null | HTMLButtonElement) => {
        this.props.logger(`[${this.props.prefix}] setButtonRef()`, value?.tagName || value);
    };

    private handleClick = () => {
        this.setState(({ count }) => ({
            count: count + 1
        }));
    };

    public componentDidMount() {
        this.props.logger(`[${this.props.prefix}] componentDidMount()`, this.state.count);
    }

    public getSnapshotBeforeUpdate() {
        this.props.logger(`[${this.props.prefix}] getSnapshotBeforeUpdate()`, this.state.count);
        return null;
    }

    public componentDidUpdate() {
        this.props.logger(`[${this.props.prefix}] componentDidUpdate()`, this.state.count);
    }

    public componentWillUnmount() {
        this.props.logger(`[${this.props.prefix}] componentWillUnmount()`, this.state.count);
    }

    public render() {
        this.props.logger(`[${this.props.prefix}] render()`, this.state.count);
        return (
            <button ref={this.setButtonRef} onClick={this.handleClick}>
                [{this.props.prefix}] {this.state.count}
            </button>
        );
    }
}

markClassComponentHasSideEffectRender(CounterCX);

export const LazyCounterCX = lazy(CounterCX, ({ logger, prefix }) => (
    <ForwardRef logger={logger} prefix={`${prefix}-Fallback`} />
));

export const KeepCounterCX = keepAlive(CounterCX, (props) => props.prefix);
export const KeepLazyCounterCX = keepAlive(LazyCounterCX, (props) => props.prefix);
