import React, { useEffect } from "react";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";

import Toolbar from "./Toolbar";
import InfoPopup from "./InfoPopup";
import Notification from "./Notification";
import TemplateCover from "./TemplateCover";

import Popup from "./atoms/Popup";
import StaticPage from "./atoms/StaticPage";
import MediaOverlay from "./atoms/Media";
import LoadingOverlay from "./atoms/Loading";

import Timeline from "./time/Timeline";
import Space from "./space/Space";
import Search from "./controls/Search";
import CardStack from "./controls/CardStack";
import NarrativeControls from "./controls/NarrativeControls";

import colors from "../common/global";
import { binarySearch, insetSourceFrom } from "../common/utilities";
import { isMobileOnly } from "react-device-detect";

const Dashboard = ({app, actions, domain, features, ui, narrativeIdx}) => {
  useEffect(() => {
    if (!app.isMobile) {
      fetch('/localData.json')
      .then( res => res.json())
      .then( data => {
        actions.setInitialCategories(data.associations)
        actions.updateDomain({
          domain: data,
          features: features,
        })
        const bounds = [
          [data.south, data.west], [data.north, data.east]
        ]
        console.log('DATA', data)
        console.log('Loading bounds', bounds)
        actions.updateBounds(bounds)
      })
    }
    // NOTE: hack to get the timeline to always show. Not entirely sure why
    // this is necessary.
    window.dispatchEvent(new Event("resize"));
  }, [])

  const handleHighlight = (highlighted) => {
    actions.updateHighlighted(highlighted || null);
  }

  const handleViewSource = (source) => {
    actions.updateSource(source);
  }

  const findEventIdx = (theEvent) => {
    const { events } = domain;
    return binarySearch(events, theEvent, (theev, otherev) => {
      return theev.datetime - otherev.datetime;
    });
  }

  const handleSelect = (selected, axis) => {
    if (selected.length <= 0) {
      actions.updateSelected([]);
      return;
    }

    const matchedEvents = [];
    const TIMELINE_AXIS = 0;
    if (axis === TIMELINE_AXIS) {
      matchedEvents.push(selected);
      // find in events
      const { events } = domain;
      const idx = findEventIdx(selected);
      // binary search can return event with different id
      if (events[idx].id !== selected.id) {
        matchedEvents.push(events[idx]);
      }

      // check events before
      let ptr = idx - 1;

      while (
        ptr >= 0 &&
        events[idx].datetime.getTime() === events[ptr].datetime.getTime()
      ) {
        if (events[ptr].id !== selected.id) {
          matchedEvents.push(events[ptr]);
        }
        ptr -= 1;
      }
      // check events after
      ptr = idx + 1;

      while (
        ptr < events.length &&
        events[idx].datetime.getTime() === events[ptr].datetime.getTime()
      ) {
        if (events[ptr].id !== selected.id) {
          matchedEvents.push(events[ptr]);
        }
        ptr += 1;
      }
    } else {
      // Map..
      const std = { ...selected };
      delete std.sources;
      Object.values(std).forEach((ev) => matchedEvents.push(ev));
    }

    actions.updateSelected(matchedEvents);
  }

  const getCategoryColor = (category) => {
    if (!features.USE_CATEGORIES) {
      return colors.fallbackEventColor;
    }

    const cat = ui.style.categories[category];
    if (cat) {
      return cat;
    } else {
      return ui.style.categories.default;
    }
  }

  const setNarrative = (narrative) => {
    // only handleSelect if narrative is not null and has associated events
    if (narrative && narrative.steps.length >= 1) {
      handleSelect([narrative.steps[0]]);
    }
    actions.updateNarrative(narrative);
  }

  const setNarrativeFromFilters = (withSteps) => {
    let activeFilters = app.associations.filters;

    if (activeFilters.length === 0) {
      alert("No filters selected, cant narrativise");
      return;
    }

    activeFilters = activeFilters.map((f) => ({ name: f }));

    const evs = domain.events.filter((ev) => {
      let hasOne = false;
      // add event if it has at least one matching filter
      for (let i = 0; i < activeFilters.length; i++) {
        if (ev.associations.includes(activeFilters[i].name)) {
          hasOne = true;
          break;
        }
      }
      if (hasOne) return true;
      return false;
    });

    if (evs.length === 0) {
      alert("No associated events, cant narrativise");
      return;
    }

    const name = activeFilters.map((f) => f.name).join("-");
    const desc = activeFilters.map((f) => f.description).join("\n\n");
    setNarrative({
      id: name,
      label: name,
      description: desc,
      withLines: withSteps,
      steps: evs.map(insetSourceFrom(domain.sources)),
    });
  }

  const selectNarrativeStep = (idx) => {
    // Try to find idx if event passed rather than number
    if (typeof idx !== "number") {
      const e = idx[0] || idx;

      if (app.associations.narrative) {
        const { steps } = app.associations.narrative;
        // choose the first event at a given location
        const locationEventId = e.id;
        const narrativeIdxObj = steps.find((s) => s.id === locationEventId);
        const narrativeIdx = steps.indexOf(narrativeIdxObj);

        if (narrativeIdx > -1) {
          idx = narrativeIdx;
        }
      }
    }

    const { narrative } = app.associations;
    if (narrative === null) return;

    if (idx < narrative.steps.length && idx >= 0) {
      const step = narrative.steps[idx];

      handleSelect([step]);
      actions.updateNarrativeStepIdx(idx);
    }
  }

  const onKeyDown = (e) => {
    const { narrative, selected } = app;
    const { events } = domain;

    const prev = (idx) => {
      if (narrative === null) {
        handleSelect(events[idx - 1], 0);
      } else {
        selectNarrativeStep(narrativeIdx - 1);
      }
    };
    const next = (idx) => {
      if (narrative === null) {
        handleSelect(events[idx + 1], 0);
      } else {
        selectNarrativeStep(narrativeIdx + 1);
      }
    };
    if (selected.length > 0) {
      const ev = selected[selected.length - 1];
      const idx = findEventIdx(ev);
      switch (e.keyCode) {
        case 37: // left arrow
        case 38: // up arrow
          if (idx <= 0) return;
          prev(idx);
          break;
        case 39: // right arrow
        case 40: // down arrow
          if (idx < 0 || idx >= domain.length - 1) return;
          next(idx);
          break;
        default:
      }
    }
  }

  const renderIntroPopup = (isMobile, styles) => {
    const extraContent = isMobile ? (
      <div style={{ position: "relative", bottom: 0 }}>
        <h3 style={{ color: "var(--error-red)" }}>
          This platform is not suitable for mobile.
          <br />
          <br />
          Please re-visit the site on a device with a larger screen.
        </h3>
      </div>
    ) : null;

    return (
      <Popup
        title="Introduction to the platform"
        theme="dark"
        isOpen={app.flags.isIntropopup}
        onClose={actions.toggleIntroPopup}
        content={app.intro}
        styles={styles}
        isMobile={isMobile}
      >
        {extraContent}
      </Popup>
    );
  }

  const dateHeight = 80;
  const padding = 2;
  const checkMobile = isMobileOnly || window.innerWidth < 600;

  const popupStyles = {
    height: checkMobile ? "100vh" : "fit-content",
    display: checkMobile ? "block" : "table",
    width: checkMobile
      ? "100vw"
      : window.innerWidth > 768
      ? "60vw"
      : "calc(100vw - var(--toolbar-width))",
    maxWidth: checkMobile ? "100vw" : 600,
    maxHeight: checkMobile
      ? "100vh"
      : window.innerHeight > 768
      ? `calc(100vh - ${app.timeline.dimensions.height}px - ${dateHeight}px)`
      : "100vh",
    left: checkMobile ? padding : "var(--toolbar-width)",
    top: 0,
    overflowY: "scroll",
  };

  if (checkMobile) {
    const msg =
      "This platform is not suitable for mobile. Please re-visit the site on a device with a larger screen.";
    return (
      <div>
        {features.USE_COVER && !app.intro && (
          <StaticPage showing={app.flags.isCover}>
            {/* enable USE_COVER in config.js features, and customise your header */}
            {/* pass 'actions.toggleCover' as a prop to your custom header */}
            <TemplateCover
              showAppHandler={() => {
                /* eslint-disable no-undef */
                alert(msg);
                /* eslint-enable no-undef */
              }}
            />
          </StaticPage>
        )}
        {app.intro && <>{renderIntroPopup(true, popupStyles)}</>}
        {!app.intro && !features.USE_COVER && (
          <div className="fixedTooSmallMessage">{msg}</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Toolbar
        isNarrative={!!app.associations.narrative}
        methods={{
          onTitle: actions.toggleCover,
          onSelectFilter: (filters) =>
            actions.toggleAssociations("filters", filters),
          onCategoryFilter: (categories) =>
            actions.toggleAssociations("categories", categories),
          onShapeFilter: actions.toggleShapes,
          onSelectNarrative: setNarrative,
        }}
      />
      <Space
        kind={"map" in app ? "map" : "space3d"}
        onKeyDown={onKeyDown}
        methods={{
          onSelectNarrative: setNarrative,
          getCategoryColor: getCategoryColor,
          onSelect: app.associations.narrative
            ? selectNarrativeStep
            : (ev) => handleSelect(ev, 1),
        }}
      />
      <Timeline
        onKeyDown={onKeyDown}
        methods={{
          onSelect: app.associations.narrative
            ? selectNarrativeStep
            : (ev) => handleSelect(ev, 0),
          onUpdateTimerange: actions.updateTimeRange,
          getCategoryColor: getCategoryColor,
        }}
      />
      <CardStack
        timelineDims={app.timeline.dimensions}
        onViewSource={handleViewSource}
        onSelect={
          app.associations.narrative ? selectNarrativeStep : () => null
        }
        onHighlight={handleHighlight}
        onToggleCardstack={() => actions.updateSelected([])}
        getCategoryColor={getCategoryColor}
      />
      <NarrativeControls
        narrative={
          app.associations.narrative
            ? {
                ...app.associations.narrative,
                current: narrativeIdx,
              }
            : null
        }
        methods={{
          onNext: () => selectNarrativeStep(narrativeIdx + 1),
          onPrev: () => selectNarrativeStep(narrativeIdx - 1),
          onSelectNarrative: setNarrative,
        }}
      />
      <InfoPopup
        language={app.language}
        styles={popupStyles}
        isOpen={app.flags.isInfopopup}
        onClose={actions.toggleInfoPopup}
      />
      {renderIntroPopup(false, popupStyles)}
      {app.debug ? (
        <Notification
          isNotification={app.flags.isNotification}
          notifications={domain.notifications}
          onToggle={actions.markNotificationsRead}
        />
      ) : null}
      {features.USE_SEARCH && (
        <Search
          narrative={app.narrative}
          queryString={app.searchQuery}
          events={domain.events}
          onSearchRowClick={handleSelect}
        />
      )}
      {app.source ? (
        <MediaOverlay
          source={app.source}
          onCancel={() => {
            actions.updateSource(null);
          }}
        />
      ) : null}
      <LoadingOverlay
        isLoading={app.loading || app.flags.isFetchingDomain}
        ui={app.flags.isFetchingDomain}
        language={app.language}
      />
      {features.USE_COVER && (
        <StaticPage showing={app.flags.isCover}>
          {/* enable USE_COVER in config.js features, and customise your header */}
          {/* pass 'actions.toggleCover' as a prop to your custom header */}
          <TemplateCover
            showing={app.flags.isCover}
            showAppHandler={actions.toggleCover}
          />
        </StaticPage>
      )}
    </div>
  );
}


function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

export default connect(
  (state) => ({
    ...state,
    narrativeIdx: selectors.selectNarrativeIdx(state),
    narratives: selectors.selectNarratives(state),
    selected: selectors.selectSelected(state),
  }),
  mapDispatchToProps
)(Dashboard);
