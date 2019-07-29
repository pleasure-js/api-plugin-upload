<a name="PleasureApiPluginUpload"></a>

## PleasureApiPluginUpload
A user could define the permissions of the entity file-uploads by defining the model. It should work out of the box
too, though.

**Kind**: global class  

* [PleasureApiPluginUpload](#PleasureApiPluginUpload)
    * [.setFileUpload(category, destination, onUpload)](#PleasureApiPluginUpload+setFileUpload)
    * [.prepare](#PleasureApiPluginUpload+prepare) : <code>function</code>

<a name="PleasureApiPluginUpload+setFileUpload"></a>

### pleasureApiPluginUpload.setFileUpload(category, destination, onUpload)
**Kind**: instance method of [<code>PleasureApiPluginUpload</code>](#PleasureApiPluginUpload)  

| Param | Type | Description |
| --- | --- | --- |
| category | <code>String</code> |  |
| destination | <code>String</code> \| <code>function</code> | Where to store the file. It can be a function receiving an `uploadRequest` object as the only argument. |
| onUpload | <code>function</code> |  |

<a name="PleasureApiPluginUpload+prepare"></a>

### pleasureApiPluginUpload.prepare : <code>function</code>
**Kind**: instance typedef of [<code>PleasureApiPluginUpload</code>](#PleasureApiPluginUpload)  

| Param |
| --- |
| getEntities | 
| router | 
| config | 


* * *

&copy; 2019 Martin Rafael <tin@devtin.io>
