const PageNavigator = ({ currentPage, totalPages, goToPage, addPage }) => {
    return (
        <div className="page-navigator">
            <button
                className="btn btn-icon page-nav-btn tooltip"
                data-tooltip="Previous Page"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                style={{ opacity: currentPage === 0 ? 0.35 : 1 }}
            >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            <div className="page-indicator">
                <span className="page-current">{currentPage + 1}</span>
                <span className="page-sep">/</span>
                <span className="page-total">{totalPages}</span>
            </div>

            <button
                className="btn btn-icon page-nav-btn tooltip"
                data-tooltip="Next Page"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                style={{ opacity: currentPage >= totalPages - 1 ? 0.35 : 1 }}
            >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>

            <button
                className="btn btn-icon page-nav-btn tooltip page-add-btn"
                data-tooltip="Add Page"
                onClick={addPage}
            >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    );
};

export default PageNavigator;
