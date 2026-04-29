import React from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin Dashboard Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/admin/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#161c27] border border-red-500/20 rounded-[2.5rem] p-8 text-center shadow-2xl shadow-red-500/5">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
              <FiAlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              Dashboard <span className="text-red-500">Crash</span>
            </h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              An unexpected error occurred in this section of the admin panel.
              Don't worry, your data is safe.
            </p>

            <div className="bg-slate-950/50 rounded-2xl p-4 mb-8 border border-white/5 text-left overflow-auto max-h-32">
              <code className="text-[10px] text-rose-300 font-mono">
                {this.state.error?.toString()}
              </code>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              <FiRefreshCw size={16} /> Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
