import React, {Component} from 'react';
import * as wrapper from 'solc/wrapper'
const solcjs = require('solc-js');
const selectVersion = solcjs.version2url;

class CompilerVersion extends Component {
	constructor(props) {
		super(props);
		this.state = {select: null, loadingError: null};
	}

	componentDidMount() {
		selectVersion((error, select) => {
			if (error) {
				this.setState({loadingError: 'versions'});
				return console.error(error);
			}
			// const useVersion = (error, url) => {
			// 	if (error) {
			// 		this.setState({error: error.description});
			// 		return console.error(error);
			// 	}
			// 	console.log('url:', url);
			//
			// 	solcjs.loadCompiler(url, (compiler) => {
			// 		let solc = wrapper(compiler);
			// 		let m = solc.version().match(/^(\d+\.\d+\.\d+)/);
			// 		if ((m != null) && (m.length > 1)) {
			// 			this.setState({compilerVersion: solc.version()});
			// 			this.props.onCompilerVersionChange(m[1]);
			// 			this.props.onCompilerChange(solc);
			// 		}
			// 	});
			// };

			this.props.onCompilerLoaderChanged(select);

			let selectedRelease = null;
			select.releases.forEach((r) => {
				if (r === this.props.preferredCompilerVersion)
				{
					let m = r.match(/^v(\d+\.\d+\.\d+)/);
					selectedRelease = r;
					this.props.onCompilerVersionChange(m[1], selectedRelease);
					return;
				}
			});
			if (!selectedRelease) {
				let m = select.releases[0].match(/^v(\d+\.\d+\.\d+)/);
				selectedRelease = select.releases[0];
				this.props.onCompilerVersionChange(m[1], selectedRelease);
			}

			this.setState({loadingError: null, select: select, selectedRelease: selectedRelease});
			//select(select.releases[0], useVersion);
		});
	}

	render() {
		return (<div className={"compiler-version"}>
			{this.state.select &&
			<div className="form-group">
				<label htmlFor="compiler-select">Compiler Version</label>
			<select defaultValue={this.state.selectedRelease} className="form-control" id={"compiler-select"}>
				{this.state.select.releases.map((r, index) => {
					return <option key={index}>{r}</option>;
				})}
				</select>
					<small id="emailHelp" className="form-text text-muted">Use this list to change the compiler version.</small>
					</div>
				}
			{!this.state.select &&
				<div className={"loading-versions"}>
					Checking for available compilers.
				</div>
			}
		</div>)
	}
}

export default CompilerVersion;
