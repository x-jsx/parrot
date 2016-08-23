/**
 * popover will be closed on
 * 		2.1 mouse down on others in document
 * 		2.2 press escape or tab
 * 		2.3 mouse wheel
 *		2.4 window resize
 */
(function(window, $, React, ReactDOM, $pt) {
	var NSelectTree = React.createClass($pt.defineCellComponent({
		displayName: 'NSelectTree',
		statics: {
			POP_FIX_ON_BOTTOM: false,
			PLACEHOLDER: "Please Select...",
			CLOSE_TEXT: 'Close'
		},
		propTypes: {
			// model
			model: React.PropTypes.object,
			// CellLayout
			layout: React.PropTypes.object
		},
		getDefaultProps: function() {
			return {
				defaultOptions: {
					hideChildWhenParentChecked: false
				},
				treeLayout: {
					comp: {
						root: false,
						check: true,
						multiple: true,
						hierarchyCheck: false
					}
				}
			};
		},
		getInitialState: function() {
			return {};
		},
		/**
		 * will update
		 * @param nextProps
		 */
		componentWillUpdate: function (nextProps) {
			// remove post change listener to handle model change
			this.removePostChangeListener(this.__forceUpdate);
			this.removeVisibleDependencyMonitor();
			this.removeEnableDependencyMonitor();
			if (this.hasParent()) {
				// add post change listener into parent model
				this.getParentModel().removeListener(this.getParentPropertyId(), "post", "change", this.onParentModelChanged);
			}
			this.unregisterFromComponentCentral();
		},
		/**
		 * did update
		 * @param prevProps
		 * @param prevState
		 */
		componentDidUpdate: function (prevProps, prevState) {
			// add post change listener to handle model change
			this.addPostChangeListener(this.__forceUpdate);
			this.addVisibleDependencyMonitor();
			this.addEnableDependencyMonitor();
			if (this.hasParent()) {
				// add post change listener into parent model
				this.getParentModel().addListener(this.getParentPropertyId(), "post", "change", this.onParentModelChanged);
			}
			this.registerToComponentCentral();

			if (this.state.popoverDiv && this.state.popoverDiv.is(':visible')) {
				this.showPopover();
			}
		},
		/**
		 * did mount
		 */
		componentDidMount: function () {
			// add post change listener to handle model change
			this.addPostChangeListener(this.__forceUpdate);
			this.addVisibleDependencyMonitor();
			this.addEnableDependencyMonitor();
			if (this.hasParent()) {
				// add post change listener into parent model
				this.getParentModel().addListener(this.getParentPropertyId(), "post", "change", this.onParentModelChanged);
			}
			this.registerToComponentCentral();
			if (this.state.onloading) {
				this.getCodeTable().initializeRemote().done(function() {
					this.setState({onloading: false});
				}.bind(this));
			}
			this.state.mounted = true;
		},
		/**
		 * will unmount
		 */
		componentWillUnmount: function () {
			this.destroyPopover();
			// remove post change listener to handle model change
			this.removePostChangeListener(this.__forceUpdate);
			this.removeVisibleDependencyMonitor();
			this.removeEnableDependencyMonitor();
			if (this.hasParent()) {
				// add post change listener into parent model
				this.getParentModel().removeListener(this.getParentPropertyId(), "post", "change", this.onParentModelChanged);
			}
			this.unregisterFromComponentCentral();
		},
		renderTree: function() {
			var layout = $pt.createCellLayout('values', this.getTreeLayout());
			var model = $pt.createModel({values: this.getValueFromModel()});
			model.addPostChangeListener('values', this.onTreeValueChanged);
			return <$pt.Components.NTree model={model} layout={layout}/>;
		},
		renderSelectionItem: function(codeItem, nodeId) {
			if (this.isMobilePhone()) {
				return (<li key={nodeId}>{codeItem.text}</li>);
			} else {
				return (<li key={nodeId}>
					<span className='fa fa-fw fa-remove' onClick={this.onSelectionItemRemove.bind(this, nodeId)}></span>
					{codeItem.text}
				</li>);
			}
		},
		renderSelectionWhenValueAsArray: function(values) {
			var _this = this;
			var codes = null;
			if (this.isHideChildWhenParentChecked()) {
				// only render parent selections
				codes = this.getAvailableTreeModel().list();
				var isChecked = function(code) {
					return -1 != values.findIndex(function(value) {
						return value == code.id;
					});
				};
				var traverse = function(codes) {
					return codes.map(function(code) {
						if (isChecked(code)) {
							return _this.renderSelectionItem(code, code.id);
						} else if (code.children){
							return traverse(code.children);
						}
					});
				};
				return traverse(codes);
			} else {
				// render all selections
				codes = this.getAvailableTreeModel().listAllChildren();
				return Object.keys(codes).map(function(id) {
					var value = values.find(function(value) {
						return value == id;
					});
					if (value != null) {
						return _this.renderSelectionItem(codes[value], value);
					}
				});
			}
		},
		renderSelectionWhenValueAsJSON: function(values) {
			var _this = this;
			var codes = this.getAvailableTreeModel().listWithHierarchyKeys({separator: NTree.NODE_SEPARATOR, rootId: NTree.ROOT_ID});
			if (this.isHideChildWhenParentChecked()) {
				var paintedNodes = [];
				var isPainted = function(nodeId) {
					// if nodeId starts with paintedNodeId, do not paint again
					return -1 != paintedNodes.findIndex(function(paintedNodeId) {
						return nodeId.startsWith(paintedNodeId);
					});
				};
				return Object.keys(codes).map(function(nodeId) {
					if (!isPainted(nodeId)) {
						var valueId = nodeId.split(NTree.NODE_SEPARATOR).slice(1).join($pt.PROPERTY_SEPARATOR) + $pt.PROPERTY_SEPARATOR + 'selected';
						var checked = $pt.getValueFromJSON(values, valueId);
						if (checked) {
							paintedNodes.push(nodeId + NTree.NODE_SEPARATOR);
							return _this.renderSelectionItem(codes[nodeId], nodeId);
						}
					}
				});
			} else {
				var render = function(node, currentId, parentId) {
					var nodeId = parentId + NTree.NODE_SEPARATOR + currentId;
					var spans = [];
					if (node.selected) {
						spans.push(_this.renderSelectionItem(codes[nodeId], nodeId));
					}
					spans.push.apply(spans, Object.keys(node).filter(function(key) {
						return key != 'selected';
					}).map(function(key) {
						return render(node[key], key, nodeId);
					}));
					return spans;
				};
				return Object.keys(values).filter(function(key) {
					return key != 'selected';
				}).map(function(key) {
					return render(values[key], key, NTree.ROOT_ID);
				});
			}
		},
		renderSelection: function() {
			var values = this.getValueFromModel();
			if (values == null) {
				// no selection
				return null;
			} else if (this.getTreeLayout().comp.valueAsArray) {
				// value as an array
				return this.renderSelectionWhenValueAsArray(values);
			} else {
				// value as a hierarchy json object
				return this.renderSelectionWhenValueAsJSON(values);
			}
		},
		renderText: function() {
			var renderContent = function() {
				if (this.isOnLoading() && !this.state.mounted) {
					this.state.onloading = true;
					return <span className='text'>{$pt.Components.NCodeTableWrapper.ON_LOADING}</span>
				} else {
					this.state.onloading = false;
					var value = this.getValueFromModel();
					if (value == null || (Array.isArray(value) && value.length == 0)
				 		|| (typeof value === 'object' && Object.keys(value).length == 0)) {
						if (this.isViewMode()) {
							return <span className='text'/>;
						} else {
							return <span className='text'>{NSelectTree.PLACEHOLDER}</span>
						}
					} else {
						return (<ul className='selection'>
							{this.renderSelection()}
						</ul>);
					}
				}
			}.bind(this);
			return (<div className='input-group form-control' onClick={this.onComponentClicked} ref='comp'>
				{renderContent()}
				<span className='fa fa-fw fa-sort-down pull-right' />
			</div>);
		},
		render: function() {
			var css = {
				'n-disabled': !this.isEnabled(),
				'n-view-mode': this.isViewMode()
			};
			css[this.getComponentCSS('n-select-tree')] = true;
			return (<div className={$pt.LayoutHelper.classSet(css)} 
						 aria-readonly='true' 
						 readOnly='true'
						 tabIndex='0'>
				{this.renderText()}
				{this.renderNormalLine()}
				{this.renderFocusLine()}
			</div>);
		},
		renderPopoverContainer: function() {
			if (this.state.popoverDiv == null) {
				this.state.popoverDiv = $('<div>');
				this.state.popoverDiv.appendTo($('body'));
				if (!this.isMobilePhone()) {
					$(document).on('mousedown', this.onDocumentMouseDown)
						.on('keyup', this.onDocumentKeyUp)
						.on('mousewheel', this.onDocumentMouseWheel);
					$(window).on('resize', this.onWindowResize);
				} else {
					$('body').on('touchmove mousewheel', this.onDocumentMouseWheel);
				}
			}
			this.state.popoverDiv.hide();
		},
		renderPopoverOperations: function() {
			if (!this.isMobilePhone()) {
				return null;
			}
			return (<div className='operations'>
				<div>
					<a href='javascript:void(0);' onClick={this.hidePopover}>
						<span>{NSelectTree.CLOSE_TEXT}</span>
					</a>
				</div>
			</div>);
		},
		renderPopover: function() {
			var styles = {display: 'block'};
			var component = this.getComponent();
			styles.width = component.outerWidth();
			var offset = component.offset();
			styles.top = -10000; // let it out of screen
			styles.left = 0;
			var css = {
				'n-select-tree-popover': true,
				'popover': true,
				'bottom': true,
				'in': true,
			};
			if (this.isMobilePhone()) {
				css['mobile-phone'] = true;
				css['fix-bottom'] = this.isPopoverFixOnBottom();
				styles = {display: 'block'};	// reset styles
			}
			var popover = (<div role="tooltip" className={$pt.LayoutHelper.classSet(css)} style={styles}>
				<div className="arrow"></div>
				<div className="popover-content">
					{this.renderTree()}
					{this.renderPopoverOperations()}
				</div>
			</div>);
			ReactDOM.render(popover, this.state.popoverDiv.get(0), this.onPopoverRenderComplete);
		},
		showPopover: function() {
			this.renderPopoverContainer();
			this.renderPopover();
		},
		onPopoverRenderComplete: function() {
			this.state.popoverDiv.show();
			if (this.isMobilePhone()) {
				$('html').addClass('on-mobile-popover-shown');
				var tree = this.state.popoverDiv.find('div.n-tree > ul');
				tree.on('touchstart', this.onTreeTouchStart)
					.on('touchmove', this.onTreeTouchMove)
					.on('touchend', this.onTreeTouchEnd)
				return;
			}

			var popover = this.state.popoverDiv.children('.popover');
			var component = this.getComponent();
			this.recalcPopoverPosition(popover, component);
		},
		hidePopover: function() {
			// if (this.state.popoverDiv && this.state.popoverDiv.is(':visible')) {
			// 	this.state.popoverDiv.hide();
			// 	ReactDOM.render(<noscript/>, this.state.popoverDiv.get(0));
			// }
			this.destroyPopover();
		},
		destroyPopover: function() {
			$('html').removeClass('on-mobile-popover-shown');
			if (this.state.popoverDiv) {
				$(document).off('mousedown', this.onDocumentMouseDown)
					.off('keyup', this.onDocumentKeyUp)
					.off('mousewheel', this.onDocumentMouseWheel);
				$(window).off('resize', this.onWindowResize);
				if (this.isMobilePhone()) {
					$('body').off('touchmove mousewheel', this.onDocumentMouseWheel);
					var tree = this.state.popoverDiv.find('div.n-tree > ul');
					tree.off('touchstart', this.onTreeTouchStart)
						.off('touchmove', this.onTreeTouchMove)
						.off('touchend', this.onTreeTouchEnd);
				}
				this.state.popoverDiv.remove();
				delete this.state.popoverDiv;
			}
		},
		isOnLoading: function() {
			// var value = this.getValueFromModel();
			var codetable = this.getCodeTable();
			// remote and not initialized
			// is on loading
			return codetable.isRemoteButNotInitialized();
		},
		onComponentClicked: function() {
			if (!this.isEnabled() || this.isViewMode()) {
				// do nothing
				return;
			}

			if (this.isOnLoading()) {
				this.getCodeTable().initializeRemote().done(function() {
					this.setState({onloading: false});
					this.showPopover();
				}.bind(this));
			} else {
				this.showPopover();
			}
		},
		onDocumentMouseDown: function(evt) {
			var target = $(evt.target);
			if (target.closest(this.getComponent()).length == 0 && target.closest(this.state.popoverDiv).length == 0) {
				this.hidePopover();
			}
		},
		onDocumentMouseWheel: function(evt) {
			if (this.isMobilePhone()) {
				// when mobile phone, prevent the touch move and mouse wheel event
				evt.preventDefault();
				return;
			}

			var target = $(evt.target);
			if (target.closest(this.state.popoverDiv).length == 0) {
				this.hidePopover();
			}
		},
		onDocumentKeyUp: function(evt) {
			if (evt.keyCode === 27 || evt.keyCode === 9) { // escape and tab
				this.hidePopover();
			}
		},
		onWindowResize: function() {
			this.hidePopover();
		},
		/**
		 * on parent model changed
		 */
		onParentModelChanged: function() {
			var parentChanged = this.getComponentOption('parentChanged');
			if (parentChanged) {
				this.setValueToModel(parentChanged.call(this, this.getModel(), this.getParentPropertyValue()));
			} else {
				// clear values
				this.setValueToModel(null);
			}
			this.forceUpdate();
		},
		/**
		 * on tree value changed
		 */
		onTreeValueChanged: function(evt) {
			var values = evt.new;
			if (values == null) {
				this.setValueToModel(values);
			} else if (Array.isArray(values)) {
				this.setValueToModel(values.slice(0));
			} else {
				this.setValueToModel($.extend(true, {}, values));
			}
		},
		onSelectionItemRemove: function(nodeId) {
			if (!this.isEnabled()) {
				// do nothing
				return;
			}
			var values = this.getValueFromModel();
			var hierarchyCheck = this.getTreeLayout().comp.hierarchyCheck;
			if (values == null) {
				// do nothing
			} else if (this.getTreeLayout().comp.valueAsArray) {
				if (hierarchyCheck) {
					var codes = this.getAvailableTreeModel().listWithHierarchyKeys({separator: NTree.NODE_SEPARATOR, rootId: NTree.ROOT_ID});
					var codeHierarchyIds = Object.keys(codes);
					// find all children
					var childrenIds = codeHierarchyIds.filter(function(key) {
						return key.indexOf(nodeId + NTree.NODE_SEPARATOR) != -1;
					}).map(function(id) {
						return id.split(NTree.NODE_SEPARATOR).pop();
					});
					var hierarchyId = codeHierarchyIds.find(function(id) {
						return id.endsWith(NTree.NODE_SEPARATOR + nodeId);
					});
					// find itself and its ancestor ids
					var ancestorIds = codeHierarchyIds.filter(function(id) {
						return hierarchyId.startsWith(id);
					}).map(function(id) {
						return id.split(NTree.NODE_SEPARATOR).pop();
					});
					// combine
					var ids = childrenIds.concat(ancestorIds);
					// filter found ids
					this.setValueToModel(values.filter(function(id) {
						return -1 == ids.findIndex(function(idNeedRemove) {
							return id == idNeedRemove;
						});
					}));
				} else {
					// remove itself
					this.setValueToModel(values.filter(function(id) {
						return id != nodeId;
					}));
				}
			} else {
				var effectiveNodes = nodeId.split(NTree.NODE_SEPARATOR).slice(1);
				var node = $pt.getValueFromJSON(values, effectiveNodes.join($pt.PROPERTY_SEPARATOR));
				if (hierarchyCheck) {
					// set itself and its children to unselected
					Object.keys(node).forEach(function(key) {
						delete node[key];
					});
					// set its ancestors to unselected
					effectiveNodes.splice(effectiveNodes.length - 1, 1);
					effectiveNodes.forEach(function(id, index, array) {
						$pt.setValueIntoJSON(values, array.slice(0, index + 1).join($pt.PROPERTY_SEPARATOR) + $pt.PROPERTY_SEPARATOR + 'selected', false);
					});
				} else {
					// set itself to unselected
					delete node.selected;
				}
				this.getModel().firePostChangeEvent(this.getDataId(), values, values);
			}
		},
		isNodeCheckClicked: function(evt) {
			return $(evt.target).closest('.n-checkbox').length != 0;
		},
		getNodeTouchEventContainer: function(evt) {
			return $(evt.target).closest('.n-tree').children('ul').first();
		},
		getNodeContainerOffsetY: function(container) {
			var transform = container.css('transform').split(',');
			if (transform.length > 5) {
				return parseFloat(transform[5]);
			} else {
				return 0;
			}
		},
		calcNodeContainerOffsetY: function(target, offsetY) {
			if (offsetY >= 0) {
				offsetY = 0;
			} else {
				var treeHeight = target.height();
				var totalHeight = target.parent().height();
				if (treeHeight <= totalHeight) {
					return 0;
				}
				if (offsetY < (totalHeight - treeHeight)) {
					offsetY = totalHeight - treeHeight;
				}
			}
			return offsetY;
		},
		unwrapTouchEvent: function(evt) {
			return evt.touches ? evt : evt.originalEvent;
		},
		onTreeTouchStart: function(evt) {
			if (this.isNodeCheckClicked(evt)) {
				return;
			}
			this.state.touchStartClientY = this.unwrapTouchEvent(evt).touches[0].clientY;
			var target = this.getNodeTouchEventContainer(evt);
			this.state.touchStartRelatedY = this.getNodeContainerOffsetY(target);
			this.state.touchStartTime = moment();
		},
		onTreeTouchMove: function(evt) {
			if (this.isNodeCheckClicked(evt)) {
				return;
			}
			var touches = this.unwrapTouchEvent(evt).touches;
			var length = touches.length;
			if (length > 0) {
				var target = this.getNodeTouchEventContainer(evt);
				// calculate the distance of touch moving
				// make sure the first and last option are in viewport
				var distance = touches[length - 1].clientY - this.state.touchStartClientY;
				var offsetY = this.calcNodeContainerOffsetY(target, this.state.touchStartRelatedY + distance);
				target.css('transform', 'translateY(' + offsetY + 'px)');
				this.state.touchLastClientY = touches[length - 1].clientY;
			}
		},
		onTreeTouchEnd: function(evt) {
			if (this.isNodeCheckClicked(evt)) {
				return;
			}
			// continue scrolling
			// calculate the speed
			var timeUsed = moment().diff(this.state.touchStartTime, 'ms');
			// alert(timeUsed);
			if (timeUsed <= 300) {
				var distance = this.state.touchLastClientY - this.state.touchStartClientY;
				var speed = distance / timeUsed * 10;	// pixels per 10 ms
				var target = this.getNodeTouchEventContainer(evt);
				var startOffsetY = this.getNodeContainerOffsetY(target);
				var targetOffsetY = this.calcNodeContainerOffsetY(target, startOffsetY + (speed * 100 / 2));
				target.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
					target.css({
						'transition-timing-function': '', 
						'transition-duration': ''
					});
				});
				target.css({
					'transition-timing-function': 'cubic-bezier(0.1, 0.57, 0.1, 1)', 
					'transition-duration': '500ms',
					'transform': 'translateY(' + targetOffsetY + 'px)'
				});
			}

			delete this.state.touchStartClientY;
			delete this.state.touchStartRelatedY;
			delete this.state.touchStartTime;
		},
		getComponent: function() {
			return $(ReactDOM.findDOMNode(this.refs.comp));
		},
		/**
		 * get tree model
		 * @returns {CodeTable}
		 */
		getCodeTable: function() {
			return this.getComponentOption('data');
		},
		/**
		 * get available tree model
		 * @returns {CodeTable}
		 */
		getAvailableTreeModel: function() {
			var filter = this.getComponentOption('parentFilter');
			var tree = this.getCodeTable();
			// fetch data from remote is not supported now
			if (filter) {
				return filter.call(this, tree, this.getParentPropertyValue());
			} else {
				return tree;
			}
		},
		getTreeLayout: function() {
			var treeLayout = this.getComponentOption('treeLayout');
			if (treeLayout) {
				treeLayout = $.extend(true, {}, this.props.treeLayout, treeLayout);
			} else {
				treeLayout = $.extend(true, {}, this.props.treeLayout);
			}
			treeLayout.comp.data = this.getAvailableTreeModel();
			treeLayout.comp.valueAsArray = treeLayout.comp.valueAsArray ? treeLayout.comp.valueAsArray : false;
			treeLayout.evt = treeLayout.evt ? treeLayout.evt : {};
			treeLayout.evt.expand = treeLayout.evt.expand ? function(evt) {
				treeLayout.evt.expand.call(this, evt);
				this.onPopoverRenderComplete.call(this);
			} : this.onPopoverRenderComplete;
			treeLayout.evt.collapse = treeLayout.evt.collapse ? function(evt) {
				treeLayout.evt.collapse.call(this, evt);
				this.onPopoverRenderComplete.call(this);
			} : this.onPopoverRenderComplete;
			return treeLayout;
		},
		isHideChildWhenParentChecked: function() {
			var hierarchyCheck = this.getTreeLayout().comp.hierarchyCheck;
			if (hierarchyCheck) {
				return this.getComponentOption('hideChildWhenParentChecked');
			} else {
				return false;
			}
		},
		/**
		 * has parent or not
		 * @returns {boolean}
		 */
		hasParent: function() {
			return this.getParentPropertyId() != null;
		},
		/**
		 * get parent property id
		 * @returns {string}
		 */
		getParentPropertyId: function() {
			return this.getComponentOption("parentPropId");
		},
		/**
		 * get parent model
		 * @returns {ModelInterface}
		 */
		getParentModel: function () {
			var parentModel = this.getComponentOption("parentModel");
			return parentModel == null ? this.getModel() : parentModel;
		},
		/**
		 * get parent property value
		 * @returns {*}
		 */
		getParentPropertyValue: function () {
			return this.getParentModel().get(this.getParentPropertyId());
		},
		isPopoverFixOnBottom: function() {
			return this.isMobilePhone() && NSelectTree.POP_FIX_ON_BOTTOM === true;
		}
	}));
	$pt.Components.NSelectTree = NSelectTree;
	$pt.LayoutHelper.registerComponentRenderer($pt.ComponentConstants.SelectTree, function (model, layout, direction, viewMode) {
		return <$pt.Components.NSelectTree {...$pt.LayoutHelper.transformParameters(model, layout, direction, viewMode)}/>;
	});
}(window, jQuery, React, ReactDOM, $pt));
