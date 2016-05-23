class CreateMarkers < ActiveRecord::Migration
  def change
    create_table :markers do |t|
      t.string :lon
      t.string :lat
      t.string :title
      t.string :description

      t.timestamps null: false
    end
  end
end
