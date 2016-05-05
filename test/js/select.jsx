/**
 * Created by brad.wu on 8/16/2015.
 */
(function () {
    $.mockjax({
        url: '/app/codetable',
        responseTime: 2000,
        response: function () {
            this.responseText = [
                {id: '1', text: 'Option A'},
                {id: '2', text: 'Option B'},
                {id: '3', text: 'Option C'},
                {id: '4', text: 'Option D'},
                {id: '5', text: 'Option AAAAA BBBBB CCCCCCCCCCCCC DDDDDD EEEE'},
                {id: '6', text: 'Option F'},
                {id: '7', text: 'Option G'},
                {id: '8', text: 'Option H'},
                {id: '9', text: 'Option I'},
                {id: '10', text: 'Option J'},
                {id: '11', text: 'Option K'}
            ];
        }
    });
    $.mockjax({
        url: '/app/codetable2',
        responseTime: 2000,
        response: function (settings) {
            var data = settings.data;
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            if (data) {
                if (data.value == '1') {
                    this.responseText = [
                        {id: '1', text: 'Option A', parent: '1'},
                        {id: '2', text: 'Option B', parent: '1'},
                        {id: '3', text: 'Option C', parent: '1'},
                        {id: '4', text: 'Option D', parent: '1'},
                        {id: '5', text: 'Option E', parent: '1'},
                        // if other parent value received, code table automatically store
                        {id: '6', text: 'Option F', parent: '2'},
                        {id: '7', text: 'Option G', parent: '2'},
                        {id: '8', text: 'Option H', parent: '2'},
                        {id: '9', text: 'Option I', parent: '2'},
                        {id: '10', text: 'Option J', parent: '2'},
                        {id: '11', text: 'Option K', parent: '2'}
                    ];
                } else if (data.value == '2') {
                    this.responseText = [
                        {id: '6', text: 'Option F', parent: '2'},
                        {id: '7', text: 'Option G', parent: '2'},
                        {id: '8', text: 'Option H', parent: '2'},
                        {id: '9', text: 'Option I', parent: '2'},
                        {id: '10', text: 'Option J', parent: '2'},
                        {id: '11', text: 'Option K', parent: '2'},

                        {id: '1', text: 'Option A', parent: '1'},
                        {id: '2', text: 'Option B', parent: '1'},
                        {id: '3', text: 'Option C', parent: '1'},
                        {id: '4', text: 'Option D', parent: '1'},
                        {id: '5', text: 'Option E', parent: '1'}
                    ]
                } else {
                    // throw 'error';
                }
            } else {
                this.responseText = [
                    {id: '1', text: 'Option A', parent: '1'},
                    {id: '2', text: 'Option B', parent: '1'},
                    {id: '3', text: 'Option C', parent: '1'},
                    {id: '4', text: 'Option D', parent: '1'},
                    {id: '5', text: 'Option E', parent: '1'},
                    {id: '6', text: 'Option F', parent: '2'},
                    {id: '7', text: 'Option G', parent: '2'},
                    {id: '8', text: 'Option H', parent: '2'},
                    {id: '9', text: 'Option I', parent: '2'},
                    {id: '10', text: 'Option J', parent: '2'},
                    {id: '11', text: 'Option K', parent: '2'}
                ];
            }
        }
    });
    var model = $pt.createModel({
        name: '7',
        parentValue: '1',
        childValue: '2'
    });
    var data = $pt.createCodeTable([
        {id: '1', text: 'Option A'},
        {id: '2', text: 'Option B'},
        {id: '3', text: 'Option C'},
        {id: '4', text: 'Option D'},
        {id: '5', text: 'Option AAAAA BBBBB CCCCCCCCCCCCC DDDDDD EEEE'},
        {id: '6', text: 'Option F'},
        {id: '7', text: 'Option G'},
        {id: '8', text: 'Option H'},
        {id: '9', text: 'Option I'},
        {id: '10', text: 'Option J'},
        {id: '11', text: 'Option K'}
    ]);
    var normal = $pt.createCellLayout('name', {
        label: 'Click me',
        comp: {
            type: $pt.ComponentConstants.Select,
            data: data,
            minimumResultsForSearch: Infinity
        },
        pos: {row: 1, col: 1}
    });
    var filter = $pt.createCellLayout('name', {
        label: 'Click me',
        comp: {
            type: $pt.ComponentConstants.Select,
            data: data,
            minimumResultsForSearch: 1
        },
        pos: {row: 1, col: 1}
    });
    var disabledNormal = $pt.createCellLayout('name', {
        label: 'Click me',
        comp: {
            type: $pt.ComponentConstants.Select,
            data: data,
            enabled: {
                when: function () {
                    return false;
                },
                depends: 'name'
            }
        },
        pos: {row: 1, col: 1}
    });
    var remote = $pt.createCellLayout('name', {
        comp: {
            type: $pt.ComponentConstants.Select,
            data: $pt.createCodeTable({url: '/app/codetable'})
        },
        pos: {row: 1, col: 1}
    });

    var panel = (<div className='row'>
        <div className='col-md-3 col-lg-3 col-sm-3'>
            <span>Select2</span>
            <NSelect model={model} layout={normal}/>
            <span>Option Filter Select2</span>
            <NSelect model={model} layout={filter}/>
        </div>
        <div className='col-md-3 col-lg-3 col-sm-3 has-error'>
            <span>Error Select2</span>
            <NSelect model={model} layout={normal}/>
            <span>Error Option Filter Select2</span>
            <NSelect model={model} layout={filter}/>
        </div>
        <div className='col-md-3 col-lg-3 col-sm-3'>
            <span>Disabled Select2</span>
            <NSelect model={model} layout={disabledNormal}/>
        </div>
        <div className='col-md-3 col-lg-3 col-sm-3 has-error'>
            <span>Error Disabled Select2</span>
            <NSelect model={model} layout={disabledNormal}/>
        </div>
        <div className='col-md-3 col-lg-3 col-sm-3'>
            <span>View Mode</span>
            <NSelect model={model} layout={normal} view={true}/>
        </div>
        <div className='col-md-3 col-lg-3 col-sm-3'>
            <span>Remote</span>
            <NSelect model={model} layout={remote} />
            <span>Remote View Mode</span>
            <NSelect model={model} layout={remote} view={true}/>
        </div>
        <div className='col-md-3 col-lg-3 col-sm-3' style={{border: '1px solid #e0e0e0'}}>
            <span>Hierarchy Parent</span>
            <NText model={model} layout={$pt.createCellLayout('parentValue', {})} />

            <span>Hierarchy Child Only Load When Parent Has Value</span>
            <NSelect model={model} layout={$pt.createCellLayout('childValue', {
                comp: {
                    data: $pt.createCodeTable({url: '/app/codetable2'}),
                    parentPropId: 'parentValue',
                    parentFilter: {name: 'parent'}
                }
            })} />
        </div>
    </div>);
    ReactDOM.render(panel, document.getElementById('main'));
})();